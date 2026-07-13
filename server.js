require('dotenv').config({ override: true });

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool, hazir } = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // Render bir proxy arkasında çalışır, gerçek IP için gerekli

// Temel güvenlik header'ları (XSS/clickjacking/MIME-sniffing koruması)
app.use(helmet({
  contentSecurityPolicy: false // Google Maps ve dışarıdan gelen script/resimleri kırmamak için kapalı;
                                // istenirse ileride site'a özel bir CSP tanımlanabilir
}));

app.use(express.static('public', { extensions: ['html'] }));
app.use(express.json());

// Admin paneli artık tahmin edilmesi zor bir adreste yayında.
// (Not: gerçek güvenlik yine de şifre + rate limit + token doğrulamasından
// geliyor; bu sadece ek bir gizlilik katmanı.)
app.get('/yonetim-56209', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'yonetim-56209.html'));
});

// === SITEMAP.XML (dinamik) ===
// Statik sayfalara ek olarak veritabanındaki her ilan ve danışman için
// otomatik satır üretir; yeni ilan eklendikçe elle güncellemeye gerek kalmaz.
app.get('/sitemap.xml', async (req, res) => {
  const site = 'https://www.emlakduragim.com';
  const statikSayfalar = ['', '/satilik', '/kiralik', '/hakkimizda', '/iletisim'];

  try {
    const [ilanlar, danismanlar] = await Promise.all([
      pool.query('SELECT id, tarih FROM ilanlar ORDER BY id DESC'),
      pool.query('SELECT id FROM danismanlar ORDER BY id ASC')
    ]);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const yol of statikSayfalar) {
      const tamYol = yol === '' ? '/' : yol;
      xml += `  <url><loc>${site}${tamYol}</loc><changefreq>daily</changefreq></url>\n`;
    }
    for (const ilan of ilanlar.rows) {
      const tarih = ilan.tarih ? new Date(ilan.tarih).toISOString().split('T')[0] : '';
      xml += `  <url><loc>${site}/ilan-detay?id=${ilan.id}</loc>${tarih ? `<lastmod>${tarih}</lastmod>` : ''}<changefreq>weekly</changefreq></url>\n`;
    }
    for (const d of danismanlar.rows) {
      xml += `  <url><loc>${site}/danisman-detay?id=${d.id}</loc><changefreq>weekly</changefreq></url>\n`;
    }
    xml += '</urlset>';

    res.type('application/xml').send(xml);
  } catch (hata) {
    console.error('Sitemap oluşturulamadı:', hata);
    res.status(500).send('Sitemap oluşturulamadı');
  }
});

// Admin girişine karşı brute-force koruması: 10 dakikada en fazla 5 deneme
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { hata: 'Çok fazla deneme yapıldı. Lütfen 10 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.error(`🚨 IP ENGELLENDİ (olası brute-force) — IP: ${req.ip} — Zaman: ${new Date().toISOString()}`);
    res.status(429).json({ hata: 'Çok fazla deneme yapıldı. Lütfen 10 dakika sonra tekrar deneyin.' });
  }
});

// İletişim formu spam koruması: 1 saatte en fazla 10 mesaj
const iletisimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { hata: 'Çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false
});

// === ADMIN OTURUM YÖNETİMİ ===
// Token tabanlı koruma: şifre sadece sunucuda kontrol edilir, istemciye
// asla gönderilmez. Token'ların 4 saatlik bir geçerlilik süresi vardır;
// süresi dolan token otomatik geçersiz sayılır.
const validTokens = new Map(); // token -> son geçerlilik zamanı (ms)
const TOKEN_OMRU = 4 * 60 * 60 * 1000; // 4 saat

function adminYetkiKontrol(req, res, next) {
  const token = req.headers['x-admin-token'];
  const suresi = token && validTokens.get(token);
  if (suresi && suresi > Date.now()) {
    validTokens.set(token, Date.now() + TOKEN_OMRU); // aktif kullanımda süreyi yenile
    return next();
  }
  if (token) validTokens.delete(token); // süresi dolmuşsa temizle
  return res.status(401).json({ hata: 'Yetkisiz erişim: admin girişi gerekli' });
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { sifre } = req.body;
  const ip = req.ip;
  const zaman = new Date().toISOString();

  if (!sifre || sifre !== process.env.ADMIN_SIFRE) {
    console.warn(`🔒 BAŞARISIZ giriş denemesi — IP: ${ip} — Zaman: ${zaman}`);
    return res.status(401).json({ hata: 'Hatalı şifre' });
  }

  console.log(`✅ Başarılı admin girişi — IP: ${ip} — Zaman: ${zaman}`);
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.set(token, Date.now() + TOKEN_OMRU);
  res.json({ token });
});

// === RESİM YÜKLEME AYARLARI (Supabase Storage) ===
// Yerel diske değil, Supabase Storage'a yüklenir; böylece Render'da her
// deploy'da diskin sıfırlanması fotoğrafları silmez.
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanımlı değil — resim yükleme çalışmayacak!');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const RESIM_BUCKET = 'ilan-resimleri';

const IZINLI_TIPLER = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp'
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const uzanti = path.extname(file.originalname).toLowerCase();
    const beklenenMime = IZINLI_TIPLER[uzanti];
    if (beklenenMime && beklenenMime === file.mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Sadece jpg, jpeg, png veya webp resim dosyaları yüklenebilir!'));
    }
  }
});

// === CONFIG ===
app.get('/api/config', (req, res) => {
  res.json({
    googleMapsKey: process.env.GOOGLE_MAPS_API_KEY
    // Not: admin şifresi artık buradan asla gönderilmiyor.
    // Doğrulama /api/admin/login üzerinden sunucu tarafında yapılıyor.
  });
});

// === RESİM YÜKLE ===
// Dosyanın gerçekten beyan edilen türde bir resim olup olmadığını,
// ilk baytlarına (magic bytes) bakarak doğrular. Uzantı/MIME sahteciliğine
// (ör. .png gibi görünen ama içi <script> dolu bir SVG/HTML dosyası) karşı
// son savunma katmanı.
const sharp = require('sharp');

function gercekResimMi(buffer) {
  const hex = buffer.subarray(0, 12).toString('hex');
  const isJPEG = hex.startsWith('ffd8ff');
  const isPNG  = hex.startsWith('89504e470d0a1a0a');
  const isWEBP = buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return isJPEG || isPNG || isWEBP;
}

app.post('/api/resim-yukle', adminYetkiKontrol, upload.array('resimler', 35), async (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ hata: 'Dosya yüklenmedi' });

  for (const f of req.files) {
    if (!gercekResimMi(f.buffer)) {
      return res.status(400).json({ hata: 'Geçersiz resim dosyası tespit edildi' });
    }
  }

  try {
    const urls = [];
    for (const f of req.files) {
      // Sitenin hızlı yüklenmesi için: en fazla 1600px genişlik, kaliteli
      // ama sıkıştırılmış JPEG'e çevir. Telefon kameralarından gelen
      // 4-8MB'lık orijinal fotoğraflar bu sayede birkaç yüz KB'a iner.
      const sikistirilmis = await sharp(f.buffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 78, mozjpeg: true })
        .toBuffer();

      const dosyaAdi = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;

      const { error } = await supabase.storage
        .from(RESIM_BUCKET)
        .upload(dosyaAdi, sikistirilmis, { contentType: 'image/jpeg', upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from(RESIM_BUCKET).getPublicUrl(dosyaAdi);
      urls.push(data.publicUrl);
    }
    res.json({ urls });
  } catch (hata) {
    console.error('Supabase Storage yükleme hatası:', hata);
    res.status(500).json({ hata: 'Resim yüklenirken bir sorun oluştu' });
  }
});
// === TÜM İLANLARI GETİR ===
app.get('/api/ilanlar', async (req, res) => {
  try {
    const { tip } = req.query;
    const temelSorgu = `
      SELECT i.*,
        COALESCE(d.ad, 'Oktay Bingöl') as danisman_ad,
        COALESCE(d.telefon, '0534 540 64 64') as danisman_tel,
        d.foto as danisman_foto
      FROM ilanlar i LEFT JOIN danismanlar d ON i.danisman_id = d.id
    `;
    let sonuc;
    if (tip && tip !== 'tumu') {
      sonuc = await pool.query(temelSorgu + ' WHERE i.tip = $1 ORDER BY i.id DESC', [tip]);
    } else {
      sonuc = await pool.query(temelSorgu + ' ORDER BY i.id DESC');
    }
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'İlanlar getirilemedi' });
  }
});

// === TEK İLAN GETİR ===
app.get('/api/ilanlar/:id', async (req, res) => {
  try {
    const sonuc = await pool.query(`
      SELECT i.*,
        COALESCE(d.ad, 'Oktay Bingöl') as danisman_ad,
        COALESCE(d.telefon, '0534 540 64 64') as danisman_tel,
        d.foto as danisman_foto
      FROM ilanlar i LEFT JOIN danismanlar d ON i.danisman_id = d.id
      WHERE i.id = $1
    `, [req.params.id]);
    if (sonuc.rows.length === 0) return res.status(404).json({ hata: 'İlan bulunamadı' });
    res.json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'İlan getirilemedi' });
  }
});

// === YENİ İLAN EKLE ===
app.post('/api/ilanlar', adminYetkiKontrol, async (req, res) => {
  const {
    baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, metrekare_brut, resim, resimler, aciklama,
    kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
    imar, ada_parsel, cephe, kredi_uygunluk, takas, danisman_id
  } = req.body;

  if (!baslik || !konum || !fiyat || !tip || !emlak_tipi)
    return res.status(400).json({ hata: 'Zorunlu alanlar eksik!' });

  const resimlerStr = Array.isArray(resimler) ? resimler.join(',') : (resimler || resim || '');
  const anaResim    = Array.isArray(resimler) && resimler.length > 0 ? resimler[0] : (resim || '');

  try {
    const sonuc = await pool.query(`
      INSERT INTO ilanlar
      (baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, metrekare_brut, resim, resimler, aciklama,
       kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
       imar, ada_parsel, cephe, kredi_uygunluk, takas, danisman_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
      RETURNING id
    `, [
      baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, metrekare_brut || null, anaResim, resimlerStr, aciklama,
      kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
      imar, ada_parsel, cephe, kredi_uygunluk, takas, danisman_id || null
    ]);
    res.status(201).json({ mesaj: 'İlan eklendi!', id: sonuc.rows[0].id });
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'İlan eklenemedi' });
  }
});

// === İLAN SİL ===
app.delete('/api/ilanlar/:id', adminYetkiKontrol, async (req, res) => {
  try {
    const sonuc = await pool.query('DELETE FROM ilanlar WHERE id = $1', [req.params.id]);
    if (sonuc.rowCount === 0) return res.status(404).json({ hata: 'İlan bulunamadı' });
    res.json({ mesaj: 'İlan silindi' });
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'İlan silinemedi' });
  }
});

// === İLAN GÜNCELLE ===
app.put('/api/ilanlar/:id', adminYetkiKontrol, async (req, res) => {
  const {
    baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, metrekare_brut, resim, resimler, aciklama,
    kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
    imar, ada_parsel, cephe, kredi_uygunluk, takas, danisman_id
  } = req.body;

  const resimlerStr = Array.isArray(resimler) ? resimler.join(',') : (resimler || '');
  const anaResim    = Array.isArray(resimler) && resimler.length > 0 ? resimler[0] : (resim || '');

  try {
    const sonuc = await pool.query(`
      UPDATE ilanlar SET
        baslik=$1, konum=$2, fiyat=$3, tip=$4, emlak_tipi=$5, oda=$6, metrekare=$7,
        metrekare_brut=$8, resim=$9, resimler=$10, aciklama=$11, kat=$12, bina_yasi=$13, isitma=$14,
        ozellikler=$15, banyo=$16, teras=$17, balkon=$18, esyali=$19, site=$20,
        imar=$21, ada_parsel=$22, cephe=$23, kredi_uygunluk=$24, takas=$25, danisman_id=$26
      WHERE id=$27
    `, [
      baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, metrekare_brut || null,
      anaResim, resimlerStr, aciklama, kat, bina_yasi, isitma, ozellikler,
      banyo, teras, balkon, esyali, site,
      imar, ada_parsel, cephe, kredi_uygunluk, takas, danisman_id || null,
      req.params.id
    ]);
    if (sonuc.rowCount === 0) return res.status(404).json({ hata: 'İlan bulunamadı' });
    res.json({ mesaj: 'İlan güncellendi!' });
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'İlan güncellenemedi' });
  }
});

// === TÜM DANIŞMANLARI GETİR ===
app.get('/api/danismanlar', async (req, res) => {
  try {
    const sonuc = await pool.query('SELECT * FROM danismanlar ORDER BY id ASC');
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'Danışmanlar getirilemedi' });
  }
});

// === TEK DANIŞMAN GETİR ===
app.get('/api/danismanlar/:id', async (req, res) => {
  try {
    const sonuc = await pool.query('SELECT * FROM danismanlar WHERE id = $1', [req.params.id]);
    if (sonuc.rows.length === 0) return res.status(404).json({ hata: 'Danışman bulunamadı' });
    res.json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'Danışman getirilemedi' });
  }
});

// === DANIŞMANA AİT İLANLAR ===
app.get('/api/danismanlar/:id/ilanlar', async (req, res) => {
  try {
    const id = req.params.id;
    const danismanSonuc = await pool.query('SELECT * FROM danismanlar WHERE id = $1', [id]);
    const danisman = danismanSonuc.rows[0];

    let sonuc;
    if (danisman && danisman.ad === 'Oktay Bingöl') {
      // Oktay Bingöl varsayılan danışman: danışmansız (boş) ilanlar da onun sayımına dahil
      sonuc = await pool.query(`
        SELECT i.*, COALESCE(d.ad, 'Oktay Bingöl') as danisman_ad
        FROM ilanlar i
        LEFT JOIN danismanlar d ON i.danisman_id = d.id
        WHERE i.danisman_id = $1 OR i.danisman_id IS NULL
        ORDER BY i.id DESC
      `, [id]);
    } else {
      sonuc = await pool.query(`
        SELECT i.*, d.ad as danisman_ad
        FROM ilanlar i
        LEFT JOIN danismanlar d ON i.danisman_id = d.id
        WHERE i.danisman_id = $1
        ORDER BY i.id DESC
      `, [id]);
    }
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'İlanlar getirilemedi' });
  }
});

// === DANIŞMAN EKLE ===
app.post('/api/danismanlar', adminYetkiKontrol, async (req, res) => {
  const { ad, telefon, foto } = req.body;
  if (!ad || !telefon) return res.status(400).json({ hata: 'Ad ve telefon zorunlu!' });
  try {
    const sonuc = await pool.query(
      'INSERT INTO danismanlar (ad, telefon, foto) VALUES ($1, $2, $3) RETURNING id',
      [ad, telefon, foto || '']
    );
    res.status(201).json({ mesaj: 'Danışman eklendi!', id: sonuc.rows[0].id });
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'Danışman eklenemedi' });
  }
});

// === DANIŞMAN SİL ===
app.delete('/api/danismanlar/:id', adminYetkiKontrol, async (req, res) => {
  try {
    const sonuc = await pool.query('DELETE FROM danismanlar WHERE id = $1', [req.params.id]);
    if (sonuc.rowCount === 0) return res.status(404).json({ hata: 'Danışman bulunamadı' });
    res.json({ mesaj: 'Danışman silindi' });
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'Danışman silinemedi' });
  }
});

// === DANIŞMAN GÜNCELLE ===
app.put('/api/danismanlar/:id', adminYetkiKontrol, async (req, res) => {
  const { ad, telefon } = req.body;
  if (!ad || !telefon) return res.status(400).json({ hata: 'Ad ve telefon zorunlu!' });
  try {
    const sonuc = await pool.query(
      'UPDATE danismanlar SET ad=$1, telefon=$2 WHERE id=$3',
      [ad, telefon, req.params.id]
    );
    if (sonuc.rowCount === 0) return res.status(404).json({ hata: 'Danışman bulunamadı' });
    res.json({ mesaj: 'Danışman güncellendi!' });
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: 'Danışman güncellenemedi' });
  }
});

// === NODEMAILER KURULUM ===
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// === İLETİŞİM FORMU MAİL GÖNDER ===
app.post('/api/iletisim', iletisimLimiter, async (req, res) => {
  const { ad_soyad, telefon, email, konu, mesaj, kvkk_onay } = req.body;

  if (!ad_soyad || !telefon || !email || !konu || !mesaj) {
    return res.status(400).json({ hata: 'Tüm alanlar zorunlu!' });
  }

  if (!kvkk_onay) {
    return res.status(400).json({ hata: 'KVKK Aydınlatma Metni onayı olmadan mesaj gönderilemez.' });
  }

  try {
    await transporter.sendMail({
      from: `"Emlak Durağı İletişim" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_TO,
      subject: `İletişim Formu: ${konu}`,
      html: `
        <h2>Yeni İletişim Formu Mesajı</h2>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold;">Ad Soyad</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(ad_soyad)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold;">Telefon</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(telefon)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold;">E-posta</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold;">Konu</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(konu)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;font-weight:bold;">Mesaj</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(mesaj)}</td></tr>
        </table>
      `
    });
    res.json({ mesaj: 'Mail gönderildi!' });
  } catch (hata) {
    console.error('Mail hatası:', hata);
    res.status(500).json({ hata: 'Mail gönderilemedi!' });
  }
});

// === 404: EŞLEŞMEYEN TÜM İSTEKLER ===
// Bu middleware, yukarıdaki hiçbir route/statik dosya ile eşleşmeyen tüm
// isteklerde devreye girer. API istekleri için JSON, sayfa istekleri için
// markalı 404 sayfası döner.
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ hata: 'Uç nokta bulunamadı' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

hazir.then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
  });
});
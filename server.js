require('dotenv').config({ override: true });

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const db      = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public', { extensions: ['html'] }));
app.use(express.json());

// /admin adresi de /admin.html ile aynı sayfayı göstersin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// === ADMIN OTURUM YÖNETİMİ ===
// Basit token tabanlı koruma: şifre sadece sunucuda kontrol edilir,
// istemciye asla gönderilmez. Girişten sonra istemciye tek seferlik
// rastgele bir token verilir; korumalı işlemler bu token'ı ister.
const validTokens = new Set();

function adminYetkiKontrol(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token && validTokens.has(token)) return next();
  return res.status(401).json({ hata: 'Yetkisiz erişim: admin girişi gerekli' });
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

app.post('/api/admin/login', (req, res) => {
  const { sifre } = req.body;
  if (!sifre || sifre !== process.env.ADMIN_SIFRE) {
    return res.status(401).json({ hata: 'Hatalı şifre' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.add(token);
  res.json({ token });
});

// === RESİM YÜKLEME AYARLARI ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const benzersizAd = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, benzersizAd + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const gecerli = /jpeg|jpg|png|webp/.test(file.mimetype);
    gecerli ? cb(null, true) : cb(new Error('Sadece resim dosyaları yüklenebilir!'));
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
app.post('/api/resim-yukle', adminYetkiKontrol, upload.array('resimler', 35), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ hata: 'Dosya yüklenmedi' });
  const urls = req.files.map(f => '/uploads/' + f.filename);
  res.json({ urls });
});
// === TÜM İLANLARI GETİR ===
app.get('/api/ilanlar', (req, res) => {
  const { tip } = req.query;
  let ilanlar;
  if (tip && tip !== 'tumu') {
    ilanlar = db.prepare(`
      SELECT i.*,
        COALESCE(d.ad, 'Oktay Bingöl') as danisman_ad,
        COALESCE(d.telefon, '0534 540 64 64') as danisman_tel,
        d.foto as danisman_foto
      FROM ilanlar i LEFT JOIN danismanlar d ON i.danisman_id = d.id
      WHERE i.tip = ? ORDER BY i.id DESC
    `).all(tip);
  } else {
    ilanlar = db.prepare(`
      SELECT i.*,
        COALESCE(d.ad, 'Oktay Bingöl') as danisman_ad,
        COALESCE(d.telefon, '0534 540 64 64') as danisman_tel,
        d.foto as danisman_foto
      FROM ilanlar i LEFT JOIN danismanlar d ON i.danisman_id = d.id
      ORDER BY i.id DESC
    `).all();
  }
  res.json(ilanlar);
});

// === TEK İLAN GETİR ===
app.get('/api/ilanlar/:id', (req, res) => {
  const ilan = db.prepare(`
    SELECT i.*,
      COALESCE(d.ad, 'Oktay Bingöl') as danisman_ad,
      COALESCE(d.telefon, '0534 540 64 64') as danisman_tel,
      d.foto as danisman_foto
    FROM ilanlar i LEFT JOIN danismanlar d ON i.danisman_id = d.id
    WHERE i.id = ?
  `).get(req.params.id);
  if (!ilan) return res.status(404).json({ hata: 'İlan bulunamadı' });
  res.json(ilan);
});

// === YENİ İLAN EKLE ===
app.post('/api/ilanlar', adminYetkiKontrol, (req, res) => {
  const {
    baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, resim, resimler, aciklama,
    kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
    imar, ada_parsel, cephe, kredi_uygunluk, takas, danisman_id
  } = req.body;

  if (!baslik || !konum || !fiyat || !tip || !emlak_tipi)
    return res.status(400).json({ hata: 'Zorunlu alanlar eksik!' });

  const resimlerStr = Array.isArray(resimler) ? resimler.join(',') : (resimler || resim || '');
  const anaResim    = Array.isArray(resimler) && resimler.length > 0 ? resimler[0] : (resim || '');

  const sonuc = db.prepare(`
    INSERT INTO ilanlar
    (baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, resim, resimler, aciklama,
     kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
     imar, ada_parsel, cephe, kredi_uygunluk, takas, danisman_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, anaResim, resimlerStr, aciklama,
    kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
    imar, ada_parsel, cephe, kredi_uygunluk, takas, danisman_id || null
  );

  res.status(201).json({ mesaj: 'İlan eklendi!', id: sonuc.lastInsertRowid });
});

// === İLAN SİL ===
app.delete('/api/ilanlar/:id', adminYetkiKontrol, (req, res) => {
  const sonuc = db.prepare('DELETE FROM ilanlar WHERE id = ?').run(req.params.id);
  if (sonuc.changes === 0) return res.status(404).json({ hata: 'İlan bulunamadı' });
  res.json({ mesaj: 'İlan silindi' });
});

// === İLAN GÜNCELLE ===
app.put('/api/ilanlar/:id', adminYetkiKontrol, (req, res) => {
  const {
    baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, resim, resimler, aciklama,
    kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
    imar, ada_parsel, cephe, kredi_uygunluk, takas, danisman_id
  } = req.body;

  const resimlerStr = Array.isArray(resimler) ? resimler.join(',') : (resimler || '');
  const anaResim    = Array.isArray(resimler) && resimler.length > 0 ? resimler[0] : (resim || '');

  const sonuc = db.prepare(`
    UPDATE ilanlar SET
      baslik=?, konum=?, fiyat=?, tip=?, emlak_tipi=?, oda=?, metrekare=?,
      resim=?, resimler=?, aciklama=?, kat=?, bina_yasi=?, isitma=?, ozellikler=?,
      banyo=?, teras=?, balkon=?, esyali=?, site=?,
      imar=?, ada_parsel=?, cephe=?, kredi_uygunluk=?, takas=?, danisman_id=?
    WHERE id=?
  `).run(
    baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare,
    anaResim, resimlerStr, aciklama, kat, bina_yasi, isitma, ozellikler,
    banyo, teras, balkon, esyali, site,
    imar, ada_parsel, cephe, kredi_uygunluk, takas, danisman_id || null,
    req.params.id
  );

  if (sonuc.changes === 0) return res.status(404).json({ hata: 'İlan bulunamadı' });
  res.json({ mesaj: 'İlan güncellendi!' });
});

// === TÜM DANIŞMANLARI GETİR ===
app.get('/api/danismanlar', (req, res) => {
  const danismanlar = db.prepare('SELECT * FROM danismanlar ORDER BY id ASC').all();
  res.json(danismanlar);
});

// === TEK DANIŞMAN GETİR ===  ← EKSİK OLAN BUYDU
app.get('/api/danismanlar/:id', (req, res) => {
  const danisman = db.prepare('SELECT * FROM danismanlar WHERE id = ?').get(req.params.id);
  if (!danisman) return res.status(404).json({ hata: 'Danışman bulunamadı' });
  res.json(danisman);
});

// === DANIŞMANA AİT İLANLAR ===
app.get('/api/danismanlar/:id/ilanlar', (req, res) => {
  const id = req.params.id;
  const danisman = db.prepare('SELECT * FROM danismanlar WHERE id = ?').get(id);

  let ilanlar;
  if (danisman && danisman.ad === 'Oktay Bingöl') {
    // Oktay Bingöl varsayılan danışman: danışmansız (boş) ilanlar da onun sayımına dahil
    ilanlar = db.prepare(`
      SELECT i.*, COALESCE(d.ad, 'Oktay Bingöl') as danisman_ad
      FROM ilanlar i
      LEFT JOIN danismanlar d ON i.danisman_id = d.id
      WHERE i.danisman_id = ? OR i.danisman_id IS NULL
      ORDER BY i.id DESC
    `).all(id);
  } else {
    ilanlar = db.prepare(`
      SELECT i.*, d.ad as danisman_ad
      FROM ilanlar i
      LEFT JOIN danismanlar d ON i.danisman_id = d.id
      WHERE i.danisman_id = ?
      ORDER BY i.id DESC
    `).all(id);
  }
  res.json(ilanlar);
});
// === DANIŞMAN EKLE ===
app.post('/api/danismanlar', adminYetkiKontrol, (req, res) => {
  const { ad, telefon, foto } = req.body;
  if (!ad || !telefon) return res.status(400).json({ hata: 'Ad ve telefon zorunlu!' });
  const sonuc = db.prepare('INSERT INTO danismanlar (ad, telefon, foto) VALUES (?, ?, ?)').run(ad, telefon, foto || '');
  res.status(201).json({ mesaj: 'Danışman eklendi!', id: sonuc.lastInsertRowid });
});

// === DANIŞMAN SİL ===
app.delete('/api/danismanlar/:id', adminYetkiKontrol, (req, res) => {
  const sonuc = db.prepare('DELETE FROM danismanlar WHERE id = ?').run(req.params.id);
  if (sonuc.changes === 0) return res.status(404).json({ hata: 'Danışman bulunamadı' });
  res.json({ mesaj: 'Danışman silindi' });
});

// === DANIŞMAN GÜNCELLE ===
app.put('/api/danismanlar/:id', adminYetkiKontrol, (req, res) => {
  const { ad, telefon } = req.body;
  if (!ad || !telefon) return res.status(400).json({ hata: 'Ad ve telefon zorunlu!' });
  const sonuc = db.prepare('UPDATE danismanlar SET ad=?, telefon=? WHERE id=?').run(ad, telefon, req.params.id);
  if (sonuc.changes === 0) return res.status(404).json({ hata: 'Danışman bulunamadı' });
  res.json({ mesaj: 'Danışman güncellendi!' });
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
app.post('/api/iletisim', async (req, res) => {
  const { ad_soyad, telefon, email, konu, mesaj } = req.body;

  if (!ad_soyad || !telefon || !email || !konu || !mesaj) {
    return res.status(400).json({ hata: 'Tüm alanlar zorunlu!' });
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

app.listen(PORT, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
});
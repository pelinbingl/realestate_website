require('dotenv').config();

const express = require('express');
const multer  = require('multer');
// Dosya yükleme kütüphanesi
const path    = require('path');
// Dosya yolu işlemleri için Node.js'in yerleşik modülü
const fs      = require('fs');
// Dosya sistemi işlemleri için Node.js'in yerleşik modülü
const db      = require('./database');

const app  = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

// === RESİM YÜKLEME AYARLARI ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    // Resimlerin kaydedileceği klasör

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      // Klasör yoksa oluştur
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const benzersizAd = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Benzersiz dosya adı: timestamp + rastgele sayı
    const uzanti = path.extname(file.originalname);
    // Orijinal dosyanın uzantısını al (.jpg, .png vb.)
    cb(null, benzersizAd + uzanti);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  // Maksimum 5MB dosya boyutu
  fileFilter: (req, file, cb) => {
    const izinliTipler = /jpeg|jpg|png|webp/;
    const gecerli = izinliTipler.test(file.mimetype);
    // Sadece resim dosyalarına izin ver
    if (gecerli) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
  }
});

// === RESİM YÜKLEME ENDPOİNTİ ===
app.post('/api/resim-yukle', upload.array('resimler', 10), (req, res) => {
  // upload.array('resimler', 10) → "resimler" adıyla max 10 dosya al

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ hata: 'Dosya yüklenmedi' });
  }

  const urls = req.files.map(file => '/uploads/' + file.filename);
  // Her dosyanın erişilebilir URL'ini oluştur

  res.json({ urls });
  // URL listesini gönder: ["/uploads/123.jpg", "/uploads/456.jpg"]
});

// === TÜM İLANLARI GETİR ===
app.get('/api/ilanlar', (req, res) => {
  const { tip } = req.query;

  let ilanlar;
  if (tip && tip !== 'tumu') {
    ilanlar = db.prepare('SELECT * FROM ilanlar WHERE tip = ? ORDER BY id DESC').all(tip);
  } else {
    ilanlar = db.prepare('SELECT * FROM ilanlar ORDER BY id DESC').all();
  }

  res.json(ilanlar);
});

// === TEK İLAN GETİR ===
app.get('/api/ilanlar/:id', (req, res) => {
  const { id } = req.params;
  const ilan = db.prepare('SELECT * FROM ilanlar WHERE id = ?').get(id);

  if (!ilan) {
    return res.status(404).json({ hata: 'İlan bulunamadı' });
  }

  res.json(ilan);
});
// Yeni endpoint:
app.get('/api/config', (req, res) => {
    res.json({ 
        googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
        adminSifre: process.env.ADMIN_SIFRE
    });
});
// === YENİ İLAN EKLE ===
app.post('/api/ilanlar', (req, res) => {
  const {
    baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, resim, resimler, aciklama,
    kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
    imar, ada_parsel, cephe, kredi_uygunluk, takas
  } = req.body;

  if (!baslik || !konum || !fiyat || !tip || !emlak_tipi) {
    return res.status(400).json({ hata: 'Zorunlu alanlar eksik!' });
  }

  const resimlerStr = Array.isArray(resimler) ? resimler.join(',') : (resimler || resim || '');
  // Resim listesini virgülle ayrılmış string'e çevir
  // ["url1", "url2"] → "url1,url2"

  const anaResim = Array.isArray(resimler) && resimler.length > 0
    ? resimler[0]
    : (resim || '');
  // İlk resmi ana resim olarak kullan

  const ekle = db.prepare(`
    INSERT INTO ilanlar
    (baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, resim, resimler, aciklama,
     kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
     imar, ada_parsel, cephe, kredi_uygunluk, takas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sonuc = ekle.run(
    baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, anaResim, resimlerStr, aciklama,
    kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
    imar, ada_parsel, cephe, kredi_uygunluk, takas
  );

  res.status(201).json({ mesaj: 'İlan eklendi!', id: sonuc.lastInsertRowid });
});

// === İLAN SİL ===
app.delete('/api/ilanlar/:id', (req, res) => {
  const { id } = req.params;
  const sonuc = db.prepare('DELETE FROM ilanlar WHERE id = ?').run(id);

  if (sonuc.changes === 0) {
    return res.status(404).json({ hata: 'İlan bulunamadı' });
  }

  res.json({ mesaj: 'İlan silindi' });
});

app.listen(PORT, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
});
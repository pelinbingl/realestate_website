const Database = require('better-sqlite3');

const db = new Database('emlak.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS ilanlar (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    baslik          TEXT NOT NULL,
    konum           TEXT NOT NULL,
    fiyat           INTEGER NOT NULL,
    tip             TEXT NOT NULL,
    emlak_tipi      TEXT NOT NULL,
    oda             TEXT,
    metrekare       INTEGER,
    resim           TEXT,
    resimler        TEXT,
    aciklama        TEXT,
    kat             TEXT,
    bina_yasi       TEXT,
    isitma          TEXT,
    ozellikler      TEXT,
    banyo           TEXT,
    teras           TEXT,
    balkon          TEXT,
    esyali          TEXT,
    site            TEXT,
    imar            TEXT,
    ada_parsel      TEXT,
    cephe           TEXT,
    kredi_uygunluk  TEXT,
    takas           TEXT,
    tarih           TEXT DEFAULT (datetime('now'))
  )
`);

const ilanSayisi = db.prepare('SELECT COUNT(*) as sayi FROM ilanlar').get();

if (ilanSayisi.sayi === 0) {

  const ekle = db.prepare(`
    INSERT INTO ilanlar 
    (baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, resim, aciklama,
     kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
     imar, ada_parsel, cephe, kredi_uygunluk, takas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Konut ilanları
  ekle.run(
    'Modern Daire 2+1',
    'İzmir, Aliağa, Kazımdirk Mah.',
    20000, 'kiralik', 'Konut', '2+1', 105,
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
    'Merkezi konumda, ulaşımı kolay, ebeveyn banyolu modern daire.',
    '3. Kat', '1-5 Yaş', 'Kombi', 'Otopark, Asansör, Balkon',
    '1', 'Yok', 'Var', 'Eşyasız', 'Hayır',
    null, null, null, null, null
  );

  ekle.run(
    'Deniz Manzaralı Villa',
    'İzmir, Çeşme',
    8500000, 'satilik', 'Villa', '4+1', 220,
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
    'Denize sıfır, özel havuzlu, full eşyalı lüks villa.',
    'Müstakil', 'Sıfır', 'Klima', 'Havuz, Bahçe, Otopark, Eşyalı',
    '3', 'Var', 'Var', 'Eşyalı', 'Evet',
    null, null, null, null, null
  );

  ekle.run(
    'Bahçeli Müstakil Ev 3+1',
    'İzmir, Urla',
    35000, 'kiralik', 'Müstakil', '3+1', 150,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    'Geniş bahçeli, sakin mahallede müstakil ev.',
    'Giriş Kat', '6-10 Yaş', 'Kombi', 'Bahçe, Otopark',
    '2', 'Yok', 'Yok', 'Eşyasız', 'Hayır',
    null, null, null, null, null
  );

  // Arsa ilanları
  ekle.run(
    'İmarlı Köşe Arsa',
    'İzmir, Aliağa',
    3200000, 'satilik', 'Arsa', null, 500,
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
    'Ana caddeye cepheli, köşe konumda imarlı arsa.',
    null, null, null, null,
    null, null, null, null, null,
    'İmarlı', 'Ada: 112, Parsel: 34', 'Köşe Parsel', 'Evet', 'Kabul'
  );

  ekle.run(
    'Zeytinlik Tarla',
    'İzmir, Dikili',
    1800000, 'satilik', 'Zeytinlik', null, 3500,
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
    '350 adet zeytin ağacı mevcut, suya yakın verimli tarla.',
    null, null, null, null,
    null, null, null, null, null,
    'Tarım', 'Ada: 45, Parsel: 12', null, 'Hayır', 'Kabul Edilmez'
  );

  console.log('✅ Örnek ilanlar eklendi!');
}

module.exports = db;
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
    danisman_id     INTEGER,
    tarih           TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS danismanlar (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    ad      TEXT NOT NULL,
    telefon TEXT NOT NULL,
    foto    TEXT DEFAULT ''
  )
`);
// Varsayılan danışman — sadece ilk açılışta ekle
const danismanSayisi = db.prepare('SELECT COUNT(*) as sayi FROM danismanlar').get();
if (danismanSayisi.sayi === 0) {
  db.prepare('INSERT INTO danismanlar (ad, telefon) VALUES (?, ?)').run('Oktay Bingöl', '05345406464');
  console.log('✅ Varsayılan danışman eklendi!');
}

// danisman_id kolonu yoksa ekle (eski DB için)
try {
  db.exec(`ALTER TABLE ilanlar ADD COLUMN danisman_id INTEGER`);
} catch (e) {}

const ilanSayisi = db.prepare('SELECT COUNT(*) as sayi FROM ilanlar').get();

if (ilanSayisi.sayi === 0) {
  const ekle = db.prepare(`
    INSERT INTO ilanlar 
    (baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, resim, aciklama,
     kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
     imar, ada_parsel, cephe, kredi_uygunluk, takas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ==========================================
// 🌿 SATILIK ARSALAR (5 adet)
// ==========================================

// ARSA 1 — Aliağa Merkez İmarlı Konut Arsası
ekle.run(
  'Aliağa Merkez İmarlı Konut Arsası',   // baslik
  'Aliağa, İzmir',                        // konum
  2800000,                                // fiyat
  'satilik',                              // tip
  'Arsa',                                 // emlak_tipi
  null,                                   // oda (arsa için null)
  450,                                    // metrekare
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400', // resim
  'Aliağa merkezinde yola cepheli, inşaata hazır imarlı konut arsası. Ulaşım kolaylığı mevcut.', // aciklama
  null,                                   // kat
  null,                                   // bina_yasi
  null,                                   // isitma
  null,                                   // ozellikler
  null,                                   // banyo
  null,                                   // teras
  null,                                   // balkon
  null,                                   // esyali
  null,                                   // site
  'İmarlı',                               // imar
  'Ada: 214, Parsel: 18',                 // ada_parsel
  'Yola Cepheli',                         // cephe
  'Evet',                                 // kredi_uygunluk
  'Kabul Edilmez'                         // takas
);

// ARSA 2 — Aliağa Çakmaklı Tarım Arazisi
ekle.run(
  'Aliağa Çakmaklı Tarım Arazisi',
  'Çakmaklı Mahallesi, Aliağa, İzmir',
  1950000,
  'satilik',
  'Tarla',
  null,
  4200,
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400',
  'Sulamaya elverişli, verimli tarım arazisi. Bağ ve meyve bahçesi olarak kullanıma uygun.',
  null, null, null, null, null, null, null, null, null,
  'Tarım',
  'Ada: 88, Parsel: 6',
  null,                                   // cephe yok
  'Hayır',
  'Kabul'
);

// ARSA 3 — Aliağa Sanayi Yakını Köşe Arsa
ekle.run(
  'Aliağa Sanayi Yakını Köşe Arsa',
  'Horozgedik Mahallesi, Aliağa, İzmir',
  4500000,
  'satilik',
  'Arsa',
  null,
  680,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  'Sanayi bölgesine yakın, köşe konumda imarlı arsa. Ticari veya konut projesi için ideal.',
  null, null, null, null, null, null, null, null, null,
  'İmarlı',
  'Ada: 301, Parsel: 42',
  'Köşe Parsel',
  'Evet',
  'Kabul Edilmez'
);

// ARSA 4 — Aliağa Zeytinlik Denize Yakın
ekle.run(
  'Aliağa Zeytinlik — Denize Yakın',
  'Yeniköy Mahallesi, Aliağa, İzmir',
  3200000,
  'satilik',
  'Zeytinlik',
  null,
  8500,
  'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=400',
  'Denize 500 metre mesafede, 200 adet zeytin ağacına sahip bakımlı zeytinlik. Yatırımlık değerli arazi.',
  null, null, null, null, null, null, null, null, null,
  'Tarım',
  'Ada: 55, Parsel: 11',
  null,
  'Hayır',
  'Kabul'
);

// ARSA 5 — Aliağa Bağ & Bahçe Arazisi
ekle.run(
  'Aliağa Bağ & Bahçe Arazisi',
  'Gaziemir Mahallesi, Aliağa, İzmir',
  1200000,
  'satilik',
  'Bağ & Bahçe',
  null,
  2800,
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  'Yola cepheli, içinde kuyusu olan bağ bahçe arazisi. Huzurlu bir köy evi projesi için biçilmiş kaftan.',
  null, null, null, null, null, null, null, null, null,
  'Tarım',
  'Ada: 120, Parsel: 33',
  'Yola Cepheli',
  'Hayır',
  'Kabul'
);


// ==========================================
// 🏠 KİRALIK EVLER (4 adet)
// ==========================================

// KİRALIK 1 — Aliağa Merkez 2+1
ekle.run(
  'Aliağa Merkez 2+1 Kiralık Daire',     // baslik
  'Kazım Dirik Mahallesi, Aliağa, İzmir', // konum
  18000,                                  // fiyat
  'kiralik',                              // tip
  'Konut',                                // emlak_tipi
  '2+1',                                  // oda
  90,                                     // metrekare
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', // resim
  'Merkeze yürüme mesafesinde, güneş alan, bakımlı 2+1 daire. Kombi ısıtmalı, otoparklı bina.', // aciklama
  '2. Kat',                               // kat
  '6-10 Yaş',                             // bina_yasi
  'Kombi',                                // isitma
  'Otopark, Asansör, Balkon',             // ozellikler
  '1',                                    // banyo
  'Yok',                                  // teras
  'Var',                                  // balkon
  'Eşyasız',                              // esyali
  'Hayır',                                // site
  null, null, null, null, null            // arsa alanları null
);

// KİRALIK 2 — Aliağa 3+1 Bahçeli
ekle.run(
  'Aliağa 3+1 Bahçeli Kiralık Daire',
  'Mithatpaşa Mahallesi, Aliağa, İzmir',
  25000,
  'kiralik',
  'Konut',
  '3+1',
  130,
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
  'Özel kullanım bahçeli, giriş katta geniş 3+1 daire. Aile için ideal, okullara yakın konum.',
  'Giriş Kat',
  '11-20 Yaş',
  'Kombi',
  'Bahçe, Otopark',
  '2',
  'Yok',
  'Var',
  'Eşyasız',
  'Hayır',
  null, null, null, null, null
);

// KİRALIK 3 — Aliağa Eşyalı 1+1
ekle.run(
  'Aliağa Eşyalı 1+1 Kiralık Daire',
  'Cumhuriyet Mahallesi, Aliağa, İzmir',
  12000,
  'kiralik',
  'Konut',
  '1+1',
  60,
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400',
  'Yeni binada tam eşyalı, bekar veya çift için ideal 1+1 daire. Site içinde güvenlikli ortam.',
  '3. Kat',
  '1-5 Yaş',
  'Kombi',
  'Asansör, Balkon, Eşyalı',
  '1',
  'Yok',
  'Var',
  'Eşyalı',
  'Evet',
  null, null, null, null, null
);

// KİRALIK 4 — Aliağa Siteli 3+1 Residence
ekle.run(
  'Aliağa Siteli 3+1 Kiralık Residence',
  'Atatürk Mahallesi, Aliağa, İzmir',
  32000,
  'kiralik',
  'Residence',
  '3+1',
  155,
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
  'Sıfır binada havuzlu sitede, manzaralı 3+1 residence daire. Merkezi ısıtmalı, kapalı otoparklı lüks yaşam.',
  '5. Kat',
  'Sıfır',
  'Merkezi',
  'Otopark, Asansör, Balkon, Havuz',
  '2',
  'Var',
  'Var',
  'Yarı Eşyalı',
  'Evet',
  null, null, null, null, null
);


// ==========================================
// 🏡 SATILIK EVLER (4 adet)
// ==========================================

// SATILIK EV 1 — Aliağa Merkez 3+1
ekle.run(
  'Aliağa Merkez 3+1 Satılık Daire',
  'Kazım Dirik Mahallesi, Aliağa, İzmir',
  3200000,
  'satilik',
  'Konut',
  '3+1',
  120,
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
  'Aliağa merkezinde, ulaşımı kolay cadde üzeri 3+1 daire. Tapu hazır, krediye uygun.',
  '4. Kat',
  '11-20 Yaş',
  'Kombi',
  'Otopark, Asansör, Balkon',
  '1',
  'Yok',
  'Var',
  'Eşyasız',
  'Hayır',
  null, null, null, null, null
);

// SATILIK EV 2 — Yeniköy Deniz Manzaralı Villa
ekle.run(
  'Aliağa Yeniköy Deniz Manzaralı Villa',
  'Yeniköy Mahallesi, Aliağa, İzmir',
  12500000,
  'satilik',
  'Villa',
  '4+1',
  280,
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
  'Deniz manzaralı, özel yüzme havuzlu, full eşyalı lüks villa. Kapalı sitede güvenlikli yaşam.',
  'Müstakil',
  '1-5 Yaş',
  'Klima',
  'Havuz, Bahçe, Otopark, Eşyalı',
  '3',
  'Var',
  'Var',
  'Eşyalı',
  'Evet',
  null, null, null, null, null
);

// SATILIK EV 3 — Aliağa 2+1 Sıfır Daire
ekle.run(
  'Aliağa 2+1 Satılık Sıfır Daire',
  'Atatürk Mahallesi, Aliağa, İzmir',
  2400000,
  'satilik',
  'Konut',
  '2+1',
  95,
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
  'Sıfır binada, kombili, balkonlu 2+1 daire. Krediye uygun, tapu devrine hazır.',
  '2. Kat',
  'Sıfır',
  'Kombi',
  'Asansör, Balkon',
  '1',
  'Yok',
  'Var',
  'Eşyasız',
  'Hayır',
  null, null, null, null, null
);

// SATILIK EV 4 — Horozgedik Bahçeli Müstakil
ekle.run(
  'Aliağa Bahçeli Müstakil Ev 4+1',
  'Horozgedik Mahallesi, Aliağa, İzmir',
  5800000,
  'satilik',
  'Müstakil',
  '4+1',
  200,
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
  'Geniş özel bahçeli, müstakil 4+1 ev. Sakin mahallede huzurlu aile yaşamı için ideal.',
  'Müstakil',
  '6-10 Yaş',
  'Kombi',
  'Bahçe, Otopark',
  '2',
  'Var',
  'Var',
  'Eşyasız',
  'Hayır',
  null, null, null, null, null
 );

  ekle.run(
    'Modern Daire 2+1', 'İzmir, Aliağa, Kazımdirk Mah.',
    20000, 'kiralik', 'Konut', '2+1', 105,
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
    'Merkezi konumda, ulaşımı kolay, ebeveyn banyolu modern daire.',
    '3. Kat', '1-5 Yaş', 'Kombi', 'Otopark, Asansör, Balkon',
    '1', 'Yok', 'Var', 'Eşyasız', 'Hayır',
    null, null, null, null, null
  );

  ekle.run(
    'Deniz Manzaralı Villa', 'İzmir, Çeşme',
    8500000, 'satilik', 'Villa', '4+1', 220,
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
    'Denize sıfır, özel havuzlu, full eşyalı lüks villa.',
    'Müstakil', 'Sıfır', 'Klima', 'Havuz, Bahçe, Otopark, Eşyalı',
    '3', 'Var', 'Var', 'Eşyalı', 'Evet',
    null, null, null, null, null
  );

  ekle.run(
    'Bahçeli Müstakil Ev 3+1', 'İzmir, Urla',
    35000, 'kiralik', 'Müstakil', '3+1', 150,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    'Geniş bahçeli, sakin mahallede müstakil ev.',
    'Giriş Kat', '6-10 Yaş', 'Kombi', 'Bahçe, Otopark',
    '2', 'Yok', 'Yok', 'Eşyasız', 'Hayır',
    null, null, null, null, null
  );

  ekle.run(
    'İmarlı Köşe Arsa', 'İzmir, Aliağa',
    3200000, 'satilik', 'Arsa', null, 500,
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
    'Ana caddeye cepheli, köşe konumda imarlı arsa.',
    null, null, null, null, null, null, null, null, null,
    'İmarlı', 'Ada: 112, Parsel: 34', 'Köşe Parsel', 'Evet', 'Kabul'
  );

  ekle.run(
    'Zeytinlik Tarla', 'İzmir, Dikili',
    1800000, 'satilik', 'Zeytinlik', null, 3500,
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
    '350 adet zeytin ağacı mevcut, suya yakın verimli tarla.',
    null, null, null, null, null, null, null, null, null,
    'Tarım', 'Ada: 45, Parsel: 12', null, 'Hayır', 'Kabul Edilmez'
  );

  console.log('✅ Örnek ilanlar eklendi!');
}

module.exports = db;
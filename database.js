const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL ortam değişkeni tanımlı değil! Supabase bağlantı adresini ' +
    '.env dosyasına (yerelde) veya Render ortam değişkenlerine (canlıda) eklemelisin.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase pooler bağlantısı için gerekli
});

// === TABLOLARI OLUŞTUR + BAŞLANGIÇ VERİSİ ===
// Sunucu ilk ayağa kalktığında bir kere çalışır; tablolar zaten varsa
// (IF NOT EXISTS) hiçbir şeyi bozmadan atlar.
async function hazirla() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS danismanlar (
      id      SERIAL PRIMARY KEY,
      ad      TEXT NOT NULL,
      telefon TEXT NOT NULL,
      foto    TEXT DEFAULT ''
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ilanlar (
      id              SERIAL PRIMARY KEY,
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
      danisman_id     INTEGER REFERENCES danismanlar(id) ON DELETE SET NULL,
      tarih           TIMESTAMP DEFAULT NOW()
    )
  `);

  const { rows: danismanSayisi } = await pool.query('SELECT COUNT(*)::int AS sayi FROM danismanlar');
  if (danismanSayisi[0].sayi === 0) {
    await pool.query('INSERT INTO danismanlar (ad, telefon) VALUES ($1, $2)', ['Oktay Bingöl', '05345406464']);
    console.log('✅ Varsayılan danışman eklendi!');
  }

  const { rows: ilanSayisi } = await pool.query('SELECT COUNT(*)::int AS sayi FROM ilanlar');
  if (ilanSayisi[0].sayi === 0) {
    const ekle = async (...params) => {
      await pool.query(
        `INSERT INTO ilanlar
         (baslik, konum, fiyat, tip, emlak_tipi, oda, metrekare, resim, aciklama,
          kat, bina_yasi, isitma, ozellikler, banyo, teras, balkon, esyali, site,
          imar, ada_parsel, cephe, kredi_uygunluk, takas)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
        params
      );
    };

    await ekle(
      'Aliağa Merkez İmarlı Konut Arsası', 'Aliağa, İzmir', 2800000, 'satilik', 'Arsa',
      null, 450, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
      'Aliağa merkezinde yola cepheli, inşaata hazır imarlı konut arsası. Ulaşım kolaylığı mevcut.',
      null, null, null, null, null, null, null, null, null,
      'İmarlı', 'Ada: 214, Parsel: 18', 'Yola Cepheli', 'Evet', 'Kabul Edilmez'
    );

    await ekle(
      'Aliağa Çakmaklı Tarım Arazisi', 'Çakmaklı Mahallesi, Aliağa, İzmir', 1950000, 'satilik', 'Tarla',
      null, 4200, 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400',
      'Sulamaya elverişli, verimli tarım arazisi. Bağ ve meyve bahçesi olarak kullanıma uygun.',
      null, null, null, null, null, null, null, null, null,
      'Tarım', 'Ada: 88, Parsel: 6', null, 'Hayır', 'Kabul'
    );

    await ekle(
      'Aliağa Sanayi Yakını Köşe Arsa', 'Horozgedik Mahallesi, Aliağa, İzmir', 4500000, 'satilik', 'Arsa',
      null, 680, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      'Sanayi bölgesine yakın, köşe konumda imarlı arsa. Ticari veya konut projesi için ideal.',
      null, null, null, null, null, null, null, null, null,
      'İmarlı', 'Ada: 301, Parsel: 42', 'Köşe Parsel', 'Evet', 'Kabul Edilmez'
    );

    await ekle(
      'Aliağa Zeytinlik — Denize Yakın', 'Yeniköy Mahallesi, Aliağa, İzmir', 3200000, 'satilik', 'Zeytinlik',
      null, 8500, 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=400',
      'Denize 500 metre mesafede, 200 adet zeytin ağacına sahip bakımlı zeytinlik. Yatırımlık değerli arazi.',
      null, null, null, null, null, null, null, null, null,
      'Tarım', 'Ada: 55, Parsel: 11', null, 'Hayır', 'Kabul'
    );

    await ekle(
      'Aliağa Bağ & Bahçe Arazisi', 'Gaziemir Mahallesi, Aliağa, İzmir', 1200000, 'satilik', 'Bağ & Bahçe',
      null, 2800, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      'Yola cepheli, içinde kuyusu olan bağ bahçe arazisi. Huzurlu bir köy evi projesi için biçilmiş kaftan.',
      null, null, null, null, null, null, null, null, null,
      'Tarım', 'Ada: 120, Parsel: 33', 'Yola Cepheli', 'Hayır', 'Kabul'
    );

    await ekle(
      'Aliağa Merkez 2+1 Kiralık Daire', 'Kazım Dirik Mahallesi, Aliağa, İzmir', 18000, 'kiralik', 'Konut',
      '2+1', 90, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      'Merkeze yürüme mesafesinde, güneş alan, bakımlı 2+1 daire. Kombi ısıtmalı, otoparklı bina.',
      '2. Kat', '6-10 Yaş', 'Kombi', 'Otopark, Asansör, Balkon', '1', 'Yok', 'Var', 'Eşyasız', 'Hayır',
      null, null, null, null, null
    );

    await ekle(
      'Aliağa 3+1 Bahçeli Kiralık Daire', 'Mithatpaşa Mahallesi, Aliağa, İzmir', 25000, 'kiralik', 'Konut',
      '3+1', 130, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      'Özel kullanım bahçeli, giriş katta geniş 3+1 daire. Aile için ideal, okullara yakın konum.',
      'Giriş Kat', '11-20 Yaş', 'Kombi', 'Bahçe, Otopark', '2', 'Yok', 'Var', 'Eşyasız', 'Hayır',
      null, null, null, null, null
    );

    await ekle(
      'Aliağa Eşyalı 1+1 Kiralık Daire', 'Cumhuriyet Mahallesi, Aliağa, İzmir', 12000, 'kiralik', 'Konut',
      '1+1', 60, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400',
      'Yeni binada tam eşyalı, bekar veya çift için ideal 1+1 daire. Site içinde güvenlikli ortam.',
      '3. Kat', '1-5 Yaş', 'Kombi', 'Asansör, Balkon, Eşyalı', '1', 'Yok', 'Var', 'Eşyalı', 'Evet',
      null, null, null, null, null
    );

    await ekle(
      'Aliağa Siteli 3+1 Kiralık Residence', 'Atatürk Mahallesi, Aliağa, İzmir', 32000, 'kiralik', 'Residence',
      '3+1', 155, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
      'Sıfır binada havuzlu sitede, manzaralı 3+1 residence daire. Merkezi ısıtmalı, kapalı otoparklı lüks yaşam.',
      '5. Kat', 'Sıfır', 'Merkezi', 'Otopark, Asansör, Balkon, Havuz', '2', 'Var', 'Var', 'Yarı Eşyalı', 'Evet',
      null, null, null, null, null
    );

    await ekle(
      'Aliağa Merkez 3+1 Satılık Daire', 'Kazım Dirik Mahallesi, Aliağa, İzmir', 3200000, 'satilik', 'Konut',
      '3+1', 120, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
      'Aliağa merkezinde, ulaşımı kolay cadde üzeri 3+1 daire. Tapu hazır, krediye uygun.',
      '4. Kat', '11-20 Yaş', 'Kombi', 'Otopark, Asansör, Balkon', '1', 'Yok', 'Var', 'Eşyasız', 'Hayır',
      null, null, null, null, null
    );

    await ekle(
      'Aliağa Yeniköy Deniz Manzaralı Villa', 'Yeniköy Mahallesi, Aliağa, İzmir', 12500000, 'satilik', 'Villa',
      '4+1', 280, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
      'Deniz manzaralı, özel yüzme havuzlu, full eşyalı lüks villa. Kapalı sitede güvenlikli yaşam.',
      'Müstakil', '1-5 Yaş', 'Klima', 'Havuz, Bahçe, Otopark, Eşyalı', '3', 'Var', 'Var', 'Eşyalı', 'Evet',
      null, null, null, null, null
    );

    await ekle(
      'Aliağa 2+1 Satılık Sıfır Daire', 'Atatürk Mahallesi, Aliağa, İzmir', 2400000, 'satilik', 'Konut',
      '2+1', 95, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
      'Sıfır binada, kombili, balkonlu 2+1 daire. Krediye uygun, tapu devrine hazır.',
      '2. Kat', 'Sıfır', 'Kombi', 'Asansör, Balkon', '1', 'Yok', 'Var', 'Eşyasız', 'Hayır',
      null, null, null, null, null
    );

    await ekle(
      'Aliağa Bahçeli Müstakil Ev 4+1', 'Horozgedik Mahallesi, Aliağa, İzmir', 5800000, 'satilik', 'Müstakil',
      '4+1', 200, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
      'Geniş özel bahçeli, müstakil 4+1 ev. Sakin mahallede huzurlu aile yaşamı için ideal.',
      'Müstakil', '6-10 Yaş', 'Kombi', 'Bahçe, Otopark', '2', 'Var', 'Var', 'Eşyasız', 'Hayır',
      null, null, null, null, null
    );

    await ekle(
      'Modern Daire 2+1', 'İzmir, Aliağa, Kazımdirk Mah.', 20000, 'kiralik', 'Konut',
      '2+1', 105, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
      'Merkezi konumda, ulaşımı kolay, ebeveyn banyolu modern daire.',
      '3. Kat', '1-5 Yaş', 'Kombi', 'Otopark, Asansör, Balkon', '1', 'Yok', 'Var', 'Eşyasız', 'Hayır',
      null, null, null, null, null
    );

    await ekle(
      'Deniz Manzaralı Villa', 'İzmir, Çeşme', 8500000, 'satilik', 'Villa',
      '4+1', 220, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
      'Denize sıfır, özel havuzlu, full eşyalı lüks villa.',
      'Müstakil', 'Sıfır', 'Klima', 'Havuz, Bahçe, Otopark, Eşyalı', '3', 'Var', 'Var', 'Eşyalı', 'Evet',
      null, null, null, null, null
    );

    await ekle(
      'Bahçeli Müstakil Ev 3+1', 'İzmir, Urla', 35000, 'kiralik', 'Müstakil',
      '3+1', 150, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      'Geniş bahçeli, sakin mahallede müstakil ev.',
      'Giriş Kat', '6-10 Yaş', 'Kombi', 'Bahçe, Otopark', '2', 'Yok', 'Yok', 'Eşyasız', 'Hayır',
      null, null, null, null, null
    );

    await ekle(
      'İmarlı Köşe Arsa', 'İzmir, Aliağa', 3200000, 'satilik', 'Arsa',
      null, 500, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
      'Ana caddeye cepheli, köşe konumda imarlı arsa.',
      null, null, null, null, null, null, null, null, null,
      'İmarlı', 'Ada: 112, Parsel: 34', 'Köşe Parsel', 'Evet', 'Kabul'
    );

    await ekle(
      'Zeytinlik Tarla', 'İzmir, Dikili', 1800000, 'satilik', 'Zeytinlik',
      null, 3500, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
      '350 adet zeytin ağacı mevcut, suya yakın verimli tarla.',
      null, null, null, null, null, null, null, null, null,
      'Tarım', 'Ada: 45, Parsel: 12', null, 'Hayır', 'Kabul Edilmez'
    );

    console.log('✅ Örnek ilanlar eklendi!');
  }
}

const hazirRoutine = hazirla().catch(err => {
  console.error('❌ Veritabanı hazırlanırken hata oluştu:', err);
});

module.exports = { pool, hazir: hazirRoutine };
# 🏠 Emlak Durağı – Real Estate Listing Website

A full-stack, production web application for **Emlak Durağı**, a real estate agency operating in Aliağa, İzmir (Turkey). Visitors browse property listings; the agency manages everything through a custom-built, security-hardened admin panel — no third-party CMS involved.

🌐 **Live:** [emlak-duragi.onrender.com](https://emlak-duragi.onrender.com)

---

## 🚀 Features

### 👥 Visitor Side
- Listings by category (for sale / for rent) with **live filtering** — property type, district (ilçe), neighborhood (mahalle), room count, price range, minimum m²
- **Sorting** — newest, price (asc/desc), size (asc/desc)
- Detailed listing pages: photo gallery, rich-text description, embedded map, agent contact, "similar listings"
- Agent profile pages with each consultant's own portfolio
- Clean URLs (no `.html`), full SEO metadata (Open Graph, Twitter Cards), auto-generated `sitemap.xml`, `robots.txt`, branded 404 page
- KVKK-compliant contact form (Turkish data-protection disclosure + required consent, enforced both client- and server-side)
- Fully responsive, lazy-loaded images, compressed uploads

### 🔐 Admin Panel
- Server-side authenticated login — password never leaves the server; hosted at a non-guessable, undisclosed URL as an extra layer on top of real auth
- Session tokens expire after 4 hours or 5 minutes of inactivity; every login attempt (success/failure) is logged server-side
- Add / edit / delete listings and agents; drag-and-drop multi-photo upload with per-photo delete and cover selection
- Rich-text description editor (bold, italic, underline, lists), sanitized before rendering
- Address entry mirrors major Turkish listing platforms: district → searchable neighborhood picker (type-ahead, since some districts have 100+ neighborhoods), free-text street/detail, auto-built location string with a manual-override option and a one-click map preview

### 🛡️ Security
- Rate limiting on login and contact-form endpoints (brute-force / spam protection), with automatic IP-block logging
- `helmet` security headers (XSS, clickjacking, MIME-sniffing protection)
- Parameterized SQL everywhere — no injection surface
- Output escaping and HTML sanitization on all user-influenced content (stored XSS protection)
- File uploads verified by real file signature (magic bytes), not just extension/MIME header, then compressed server-side before storage
- Zero known dependency vulnerabilities (`npm audit` clean)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL ([Supabase](https://supabase.com)) |
| File storage | Supabase Storage (property photos) |
| Image processing | `sharp` (resize + compress on upload) |
| Email | Nodemailer (contact form) |
| Security | `helmet`, `express-rate-limit` |
| Hosting | [Render](https://render.com) |

> The app originally used SQLite with local disk storage for photos. Both were migrated to Supabase (Postgres + Storage) because Render's filesystem is ephemeral and previously wiped uploaded data on every deploy.

---

## 📁 Project Structure

```
realestate_website/
├── public/
│   ├── css/style.css
│   ├── js/
│   │   ├── components.js       # Shared header/footer + security helpers (escapeHtml, sanitizeHtml)
│   │   └── il-ilce-data.js     # İzmir district/neighborhood open data
│   ├── images/                 # Logo, hero image, favicons, PWA icons
│   ├── index.html, satilik.html, kiralik.html   # Listing pages
│   ├── ilan-detay.html, danisman-detay.html      # Detail pages
│   ├── gizlilik-politikasi.html                  # KVKK disclosure
│   ├── 404.html
│   ├── favicon.ico, robots.txt, site.webmanifest # kept at root — web standard requires this
│   └── [admin panel].html      # served at an undisclosed path, see below
├── server.js       # Express server, API routes, security middleware
├── database.js     # Postgres connection, schema, seed data
├── package.json
└── .gitignore
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (e.g. a free [Supabase](https://supabase.com) project)
- A Supabase Storage bucket for photos (public, named `ilan-resimleri`)

### Environment variables

Create a `.env` file in the project root (**never commit this file** — it's gitignored for a reason):

```
DATABASE_URL=postgresql://user:password@host:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SIFRE=your-admin-password
GOOGLE_MAPS_API_KEY=your-key
MAIL_USER=your-gmail-address
MAIL_PASS=your-gmail-app-password
MAIL_TO=where-contact-form-messages-go
PORT=3000
```

### Installation

```bash
git clone https://github.com/pelinbingl/realestate_website.git
cd realestate_website
npm install
node server.js
```

Open `http://localhost:3000`. On first run, the app automatically creates the required tables and seeds sample listings. The admin panel's URL is intentionally not documented here — ask the site owner.

### Before every `git push`

```bash
git status
```

Check the file list before committing — this catches accidental inclusions (like `node_modules` or `.env`) before they reach a public repo.

---

## 💡 About

This started as a personal project to build a realistic property-listing platform for a local real estate agency, and evolved into a small production system: real users, a real domain, and real operational concerns — data persistence, security hardening, SEO, performance, and legal compliance. Built without a framework or CMS to keep full control over every part of the stack.

---

## 👩‍💻 Developer

**Pelin Bingöl**
[github.com/pelinbingl](https://github.com/pelinbingl) • [linkedin.com/in/pelin-bingöl](https://linkedin.com/in/pelin-bingöl)

---
---

# 🏠 Emlak Durağı – Emlak İlan Web Sitesi

Aliağa, İzmir'de faaliyet gösteren **Emlak Durağı** için geliştirilmiş, canlı ve gerçek kullanıcılara hizmet veren full-stack bir web uygulaması. Ziyaretçiler ilanları görüntülerken, ofis tüm içeriği kendi geliştirdiğimiz, güvenlik açısından sertleştirilmiş bir admin panelinden yönetiyor — hazır bir CMS kullanılmadı.

🌐 **Canlı:** [emlak-duragi.onrender.com](https://emlak-duragi.onrender.com)

---

## 🚀 Özellikler

### 👥 Ziyaretçi Tarafı
- Kategoriye göre (satılık / kiralık) **canlı filtreleme** — emlak türü, ilçe, mahalle, oda sayısı, fiyat aralığı, minimum m²
- **Sıralama** — en yeni, fiyat (artan/azalan), m² (artan/azalan)
- Detaylı ilan sayfaları: fotoğraf galerisi, zengin metin açıklama, gömülü harita, danışman iletişim bilgisi, "benzer ilanlar"
- Her danışmanın kendi ilan portföyünü gösteren profil sayfaları
- Temiz URL'ler (`.html` yok), tam SEO meta etiketleri (Open Graph, Twitter Card), otomatik `sitemap.xml`, `robots.txt`, markalı 404 sayfası
- KVKK uyumlu iletişim formu (aydınlatma metni + zorunlu onay, hem istemci hem sunucu tarafında zorunlu kılınıyor)
- Tamamen mobil uyumlu, "lazy loading" resimler, sıkıştırılmış yüklemeler

### 🔐 Admin Paneli
- Sunucu taraflı doğrulanan giriş — şifre asla istemciye gönderilmez; gerçek kimlik doğrulamanın üzerine ek bir katman olarak, tahmin edilmesi zor, ifşa edilmemiş bir adreste yayında
- Oturum token'ları 4 saat ya da 5 dakika hareketsizlikte sona erer; her giriş denemesi (başarılı/başarısız) sunucu tarafında loglanır
- İlan ve danışman ekleme/düzenleme/silme; sürükle-bırak çoklu fotoğraf yükleme, tek tek fotoğraf silme ve kapak seçimi
- Zengin metin açıklama editörü (kalın, italik, altı çizili, liste), render öncesi güvenlik filtresinden geçiyor
- Adres girişi büyük Türk ilan platformlarındaki mantığı izliyor: ilçe → yazarak aranabilir mahalle seçici (bazı ilçelerde 100+ mahalle olduğu için), serbest metin sokak/detay, otomatik oluşan konum metni (elle düzenleme seçeneğiyle) ve tek tıkla harita önizleme

### 🛡️ Güvenlik
- Giriş ve iletişim formu uçlarında rate limiting (brute-force/spam koruması), IP engellemeleri otomatik loglanıyor
- `helmet` güvenlik header'ları (XSS, clickjacking, MIME-sniffing koruması)
- Her yerde parametreli SQL — injection riski yok
- Kullanıcı etkisindeki tüm içerikte kaçışlama ve HTML temizleme (stored XSS koruması)
- Dosya yüklemeleri gerçek dosya imzasına (magic bytes) göre doğrulanıyor, sadece uzantı/MIME başlığına değil; sonra depolamadan önce sunucu tarafında sıkıştırılıyor
- Bilinen bağımlılık açığı yok (`npm audit` temiz)

---

## 🛠️ Kullanılan Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | HTML, CSS, saf JavaScript |
| Backend | Node.js, Express 5 |
| Veritabanı | PostgreSQL ([Supabase](https://supabase.com)) |
| Dosya depolama | Supabase Storage (ilan fotoğrafları) |
| Görsel işleme | `sharp` (yüklemede yeniden boyutlandırma + sıkıştırma) |
| E-posta | Nodemailer (iletişim formu) |
| Güvenlik | `helmet`, `express-rate-limit` |
| Barındırma | [Render](https://render.com) |

> Proje başlangıçta SQLite ve yerel diskte fotoğraf depolama kullanıyordu. İkisi de Supabase'e (Postgres + Storage) taşındı; çünkü Render'ın disk alanı kalıcı değil ve her deploy'da yüklenen veriler siliniyordu.

---

## 📁 Proje Yapısı

```
realestate_website/
├── public/
│   ├── css/style.css
│   ├── js/
│   │   ├── components.js       # Ortak header/footer + güvenlik yardımcıları (escapeHtml, sanitizeHtml)
│   │   └── il-ilce-data.js     # İzmir ilçe/mahalle açık verisi
│   ├── images/                 # Logo, hero görsel, favicon'lar, PWA ikonları
│   ├── index.html, satilik.html, kiralik.html   # İlan listeleme sayfaları
│   ├── ilan-detay.html, danisman-detay.html      # Detay sayfaları
│   ├── gizlilik-politikasi.html                  # KVKK aydınlatma metni
│   ├── 404.html
│   ├── favicon.ico, robots.txt, site.webmanifest # kökte kalmalı — web standardı gereği
│   └── [admin paneli].html     # ifşa edilmemiş bir adreste servis ediliyor, aşağı bakın
├── server.js       # Express sunucu, API rotaları, güvenlik middleware'leri
├── database.js     # Postgres bağlantısı, şema, başlangıç verisi
├── package.json
└── .gitignore
```

---

## ⚙️ Kurulum

### Gereksinimler
- Node.js 18+
- Bir PostgreSQL veritabanı (örn. ücretsiz bir [Supabase](https://supabase.com) projesi)
- Fotoğraflar için Supabase Storage bucket'ı (public, `ilan-resimleri` adında)

### Ortam değişkenleri

Proje kök dizininde bir `.env` dosyası oluştur (**bu dosyayı asla commit etme** — bir sebepten `.gitignore`'da):

```
DATABASE_URL=postgresql://kullanici:sifre@host:5432/postgres
SUPABASE_URL=https://proje-adin.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-anahtarin
ADMIN_SIFRE=admin-sifren
GOOGLE_MAPS_API_KEY=anahtarin
MAIL_USER=gmail-adresin
MAIL_PASS=gmail-uygulama-sifren
MAIL_TO=iletisim-formu-mesajlarinin-gidecegi-adres
PORT=3000
```

### Adımlar

```bash
git clone https://github.com/pelinbingl/realestate_website.git
cd realestate_website
npm install
node server.js
```

`http://localhost:3000` adresini aç. İlk çalıştırmada gerekli tablolar ve örnek ilanlar otomatik oluşturulur. Admin panelinin adresi bilinçli olarak burada belgelenmemiştir — site sahibine sor.

### Her `git push`'tan önce

```bash
git status
```

Commit etmeden önce dosya listesini kontrol et — bu, `node_modules` veya `.env` gibi dosyaların yanlışlıkla public bir repoya gitmesini önler.

---

## 💡 Hakkında

Bu proje, yerel bir emlak ofisi için gerçekçi bir ilan platformu oluşturmak amacıyla kişisel proje olarak başladı ve gerçek kullanıcıları, gerçek bir alan adı ve gerçek operasyonel kaygıları (veri kalıcılığı, güvenlik sertleştirmesi, SEO, performans, yasal uyumluluk) olan küçük ölçekli bir üretim sistemine dönüştü. Hazır bir framework veya CMS kullanılmadan, yığının her katmanı üzerinde tam kontrol sağlamak amacıyla geliştirildi.

---

## 👩‍💻 Geliştirici

**Pelin Bingöl**
[github.com/pelinbingl](https://github.com/pelinbingl) • [linkedin.com/in/pelin-bingöl](https://linkedin.com/in/pelin-bingöl)

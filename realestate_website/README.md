# 🏠 Emlak Durağı – Real Estate Listing Website

A full-stack, production-ready web application built for **Emlak Durağı**, a real estate agency operating in Aliağa, İzmir (Turkey). Visitors can browse property listings, while the agency manages everything through a secure, custom-built admin panel — no third-party CMS involved.

🌐 **Live:** [emlak-duragi.onrender.com](https://emlak-duragi.onrender.com)

---

## 🚀 Features

### 👥 Visitor Side
- Browse listings by category (for sale / for rent), with live filtering
- Detailed listing pages: photo gallery, price, rich-text description, location, agent contact, and an interactive "similar listings" section
- Agent profile pages showing each consultant's own portfolio
- Clean URLs (no `.html` in any link), SEO metadata (Open Graph, Twitter Cards), auto-generated `sitemap.xml`, and `robots.txt`
- Fully responsive, mobile-first design
- Lazy-loaded images and automatically compressed uploads for fast page loads

### 🔐 Admin Panel
- Server-side authenticated login (password never leaves the server; session tokens expire after 4 hours or 5 minutes of inactivity)
- Add / edit / delete listings and agents
- Rich-text description editor (bold, italic, underline, lists) with output sanitized before rendering
- Real İzmir province address picker (district → neighborhood, sourced from official open data) instead of manual typing
- Drag-and-drop multi-photo upload with per-photo delete and cover-photo selection, both for new listings and when editing existing ones
- Photos are validated by real file signature (not just file extension) and automatically resized/compressed before storage

### 🛡️ Security
- Rate limiting on login and contact-form endpoints (brute-force / spam protection)
- `helmet` security headers (XSS, clickjacking, MIME-sniffing protection)
- Parameterized SQL everywhere (no injection surface)
- Output escaping and HTML sanitization on all user-influenced content
- File uploads verified by magic bytes, not just extension/MIME header

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

> The app originally used SQLite with local disk storage for photos. Both were migrated to Supabase (Postgres + Storage) so that listings and images persist across deploys — Render's filesystem is ephemeral and previously wiped uploaded data on every deploy.

---

## 📁 Project Structure

```
realestate_website/
├── public/
│   ├── index.html, satilik.html, kiralik.html   # Listing pages
│   ├── ilan-detay.html, danisman-detay.html      # Detail pages
│   ├── admin.html                                # Admin panel
│   ├── components.js                             # Shared header/footer + security helpers
│   ├── il-ilce-data.js                           # İzmir district/neighborhood data
│   └── style.css
├── server.js       # Express server & API routes
├── database.js     # Postgres connection, schema, and seed data
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

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://user:password@host:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SIFRE=your-admin-password
GOOGLE_MAPS_API_KEY=your-key   # optional, used for map embeds
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

Then open `http://localhost:3000`. On first run, the app automatically creates the required tables and seeds sample listings.

---

## 💡 About

This started as a personal project to build a realistic property-listing platform for a local real estate agency, and evolved into a small production system: real users, a real domain, and real operational concerns (data persistence, security hardening, SEO, performance). It's built without a framework or CMS — plain Express and vanilla JS — to keep full control over every part of the stack.

---

## 👩‍💻 Developer

**Pelin Bingöl**
[github.com/pelinbingl](https://github.com/pelinbingl) • [linkedin.com/in/pelin-bingöl](https://linkedin.com/in/pelin-bingöl)

---
---

# 🏠 Emlak Durağı – Emlak İlan Web Sitesi

Aliağa, İzmir'de faaliyet gösteren **Emlak Durağı** adlı emlak ofisi için geliştirilmiş, canlı ve gerçek kullanıcılara hizmet veren full-stack bir web uygulaması. Ziyaretçiler ilanları görüntüleyebilirken, ofis tüm içeriği kendi geliştirdiğimiz güvenli bir admin panelinden yönetiyor — hazır bir CMS kullanılmadı.

🌐 **Canlı:** [emlak-duragi.onrender.com](https://emlak-duragi.onrender.com)

---

## 🚀 Özellikler

### 👥 Ziyaretçi Tarafı
- Kategoriye göre (satılık / kiralık) canlı filtrelenebilir ilan listeleme
- Detaylı ilan sayfaları: fotoğraf galerisi, fiyat, zengin metin açıklama, konum, danışman iletişim bilgisi ve "benzer ilanlar" bölümü
- Her danışmanın kendi ilan portföyünü gösteren profil sayfaları
- Temiz URL'ler (`.html` uzantısız), SEO meta etiketleri (Open Graph, Twitter Card), otomatik oluşan `sitemap.xml` ve `robots.txt`
- Tamamen mobil uyumlu tasarım
- Hızlı yüklenme için "lazy loading" resimler ve otomatik sıkıştırılan fotoğraflar

### 🔐 Admin Paneli
- Sunucu taraflı doğrulanan güvenli giriş (şifre asla istemciye gönderilmez; oturum token'ları 4 saat sonra ya da 5 dakika hareketsizlikte otomatik sona erer)
- İlan ve danışman ekleme / düzenleme / silme
- Kalın, italik, altı çizili, liste gibi biçimlendirme destekleyen zengin metin açıklama editörü (render öncesi güvenlik filtresinden geçer)
- Elle yazmak yerine gerçek İzmir il verisine dayalı adres seçimi (ilçe → mahalle, resmi açık veriden)
- Sürükle-bırak çoklu fotoğraf yükleme; hem yeni ilan eklerken hem düzenlerken tek tek fotoğraf silme ve kapak fotoğrafı seçme
- Yüklenen fotoğraflar gerçek dosya imzasına göre doğrulanır (sadece uzantıya değil) ve depolamadan önce otomatik yeniden boyutlandırılıp sıkıştırılır

### 🛡️ Güvenlik
- Giriş ve iletişim formu uçlarında rate limiting (brute-force / spam koruması)
- `helmet` güvenlik header'ları (XSS, clickjacking, MIME-sniffing koruması)
- Her yerde parametreli SQL sorguları (injection riski yok)
- Kullanıcı etkisindeki tüm içerikte kaçışlama ve HTML temizleme
- Dosya yüklemeleri gerçek baytlarına göre doğrulanır, sadece uzantı/MIME başlığına değil

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
│   ├── index.html, satilik.html, kiralik.html   # İlan listeleme sayfaları
│   ├── ilan-detay.html, danisman-detay.html      # Detay sayfaları
│   ├── admin.html                                # Admin paneli
│   ├── components.js                             # Ortak header/footer + güvenlik yardımcıları
│   ├── il-ilce-data.js                           # İzmir ilçe/mahalle verisi
│   └── style.css
├── server.js       # Express sunucu & API rotaları
├── database.js     # Postgres bağlantısı, şema ve başlangıç verisi
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

Proje kök dizininde bir `.env` dosyası oluştur:

```
DATABASE_URL=postgresql://kullanici:sifre@host:5432/postgres
SUPABASE_URL=https://proje-adin.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-anahtarin
ADMIN_SIFRE=admin-sifren
GOOGLE_MAPS_API_KEY=anahtarin   # opsiyonel, harita gömme için
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

Sonra `http://localhost:3000` adresine git. İlk çalıştırmada gerekli tablolar ve örnek ilanlar otomatik oluşturulur.

---

## 💡 Hakkında

Bu proje, yerel bir emlak ofisi için gerçekçi bir ilan platformu oluşturmak amacıyla kişisel proje olarak başladı ve küçük ölçekli, gerçek kullanıcıları, gerçek bir alan adı ve gerçek operasyonel kaygıları (veri kalıcılığı, güvenlik sertleştirmesi, SEO, performans) olan bir üretim sistemine dönüştü. Hazır bir framework veya CMS kullanılmadan — sade Express ve saf JavaScript ile — yığının her katmanı üzerinde tam kontrol sağlamak amacıyla geliştirildi.

---

## 👩‍💻 Geliştirici

**Pelin Bingöl**
[github.com/pelinbingl](https://github.com/pelinbingl) • [linkedin.com/in/pelin-bingöl](https://linkedin.com/in/pelin-bingöl)

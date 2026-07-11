// === GÜVENLİK: HTML kaçışlama ===
// İlan/danışman gibi kullanıcı (admin) girdisi içeren verileri sayfaya
// basmadan önce bunu kullan; stored XSS'i engeller.
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// === GÜVENLİK: Zengin metin (rich text) için beyaz liste temizleme ===
// Admin panelindeki açıklama editöründen gelen HTML'i (kalın, italik, liste
// vb.) render etmeden önce kullan. Sadece izin verilen birkaç biçimlendirme
// etiketine izin verir; script/onerror/style/href gibi her türlü tehlikeli
// içeriği (ve attribute'u) tamamen temizler.
function sanitizeHtml(html) {
  const izinliEtiketler = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'BR', 'P', 'SPAN', 'DIV']);
  // Bunların içeriği (metni dahil) tamamen silinir — sadece etiketi kaldırıp
  // metnini sayfada bırakmak script/style için anlamsız ve gereksizdir.
  const tamamenSilinecek = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT']);
  const gecici = document.createElement('div');
  gecici.innerHTML = String(html ?? '');

  function temizle(node) {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 1) {
        if (tamamenSilinecek.has(child.tagName)) {
          node.removeChild(child);
        } else if (!izinliEtiketler.has(child.tagName)) {
          while (child.firstChild) node.insertBefore(child.firstChild, child);
          node.removeChild(child);
        } else {
          [...child.attributes].forEach(attr => child.removeAttribute(attr.name));
          temizle(child);
        }
      } else if (child.nodeType !== 3) {
        node.removeChild(child);
      }
    });
  }
  temizle(gecici);
  return gecici.innerHTML;
}

// === ORTAK HEADER ===
function headerYukle() {
  const mevcutSayfa = window.location.pathname;
  // Favicon artık her sayfanın <head> kısmında statik olarak tanımlı
  // (apple-touch-icon, manifest ve boyutlu favicon setiyle birlikte).
  const header = `
    <div class="topbar">
      <span>📞 0232 655 84 84 &nbsp;|&nbsp; 📞 0534 540 64 64</span>
      <span>✉️ emlakduragialiaga@gmail.com</span>
      <span>🕐 Hafta içi 09:00 - 18:00</span>
    </div>

    <header>
      <div class="logo">
        <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;">
          <img src="logo.png" alt="Emlak Durağı Logo" class="logo-img">
          <div class="logo-text">
            <span class="logo-main">EMLAK DURAĞI</span>
            <span class="logo-sub">Gayrimenkul Danışmanlığı</span>
          </div>
        </a>
      </div>
      <button class="hamburger" id="hamburger-btn" aria-label="Menüyü aç/kapat">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav id="ana-nav">
        <a href="/"      class="${mevcutSayfa === '/'      ? 'active' : ''}">Ana Sayfa</a>
        <a href="/kiralik"    class="${mevcutSayfa === '/kiralik'    ? 'active' : ''}">Kiralık</a>
        <a href="/satilik"    class="${mevcutSayfa === '/satilik'    ? 'active' : ''}">Satılık</a>
        <a href="/iletisim"   class="${mevcutSayfa === '/iletisim'   ? 'active' : ''}">İletişim</a>
        <a href="/hakkimizda" class="${mevcutSayfa === '/hakkimizda' ? 'active' : ''}">Hakkımızda</a>
      </nav>
    </header>
  `;

  document.getElementById('header-alani').innerHTML = header;
}

// === ORTAK FOOTER ===
function footerYukle() {
  const footer = `
    <footer>
      <div class="footer-container">
        <div class="footer-col">
          <img src="logo.png" alt="Logo" class="logo-img" style="margin-bottom:10px;">
          <p>Hayalinizdeki evi bulmanız için güvenilir, hızlı ve profesyonel hizmet.</p>
        </div>
        <div class="footer-col">
          <h3>Hızlı Linkler</h3>
          <ul>
            <li><a href="/">Ana Sayfa</a></li>
            <li><a href="/kiralik">Kiralık İlanlar</a></li>
            <li><a href="/satilik">Satılık İlanlar</a></li>
            <li><a href="/iletisim">İletişim</a></li>
            <li><a href="/hakkimizda">Hakkımızda</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>Hizmetlerimiz</h3>
          <ul>
            <li><a href="/satilik">Konut Satışı</a></li>
            <li><a href="/kiralik">Konut Kirası</a></li>
            <li><a href="/satilik">Arsa Satışı</a></li>
            <li><a href="/hakkimizda">Hakkımızda</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>İletişim</h3>
          <p>📍 Kazım Dirik Mah. Atatürk Cad.<br>No:78/C Aliağa/İzmir</p>
          <p>📞 0232 655 84 84</p>
          <p>📞 0534 540 64 64</p>
          <p>✉️ emlakduragialiaga@gmail.com</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 Emlak Durağı. Tüm hakları saklıdır. &nbsp;|&nbsp; <a href="/gizlilik-politikasi" style="color:inherit;text-decoration:underline;">Gizlilik Politikası (KVKK)</a></p>
      </div>
    </footer>
  `;

  document.getElementById('footer-alani').innerHTML = footer;
}

// === HER SAYFADA OTOMATİK ÇALIŞ ===
document.addEventListener('DOMContentLoaded', () => {
  headerYukle();
  footerYukle();

  // Hamburger menü toggle
  const hamburger = document.getElementById('hamburger-btn');
  const nav = document.getElementById('ana-nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('acik');
      nav.classList.toggle('acik');
    });
    // Menü linkine tıklanınca kapat
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('acik');
        nav.classList.remove('acik');
      });
    });
  }
});
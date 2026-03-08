// === ORTAK HEADER ===
function headerYukle() {
  const mevcutSayfa = window.location.pathname.split('/').pop() || 'index.html';

  const header = `
    <div class="topbar">
      <span>📞 0232 655 84 84 &nbsp;|&nbsp; 📞 0534 540 64 64</span>
      <span>✉️ info@emlakduragi.com</span>
      <span>🕐 Hafta içi 09:00 - 18:00</span>
    </div>

    <header>
      <div class="logo">
        <a href="index.html" style="display:flex;align-items:center;gap:12px;text-decoration:none;">
          <img src="logo.jpeg" alt="Emlak Durağı Logo" class="logo-img">
          <div class="logo-text">
            <span class="logo-main">EMLAK DURAĞI</span>
            <span class="logo-sub">Gayrimenkul Danışmanlığı</span>
          </div>
        </a>
      </div>
      <nav>
        <a href="index.html"      class="${mevcutSayfa === 'index.html'      ? 'active' : ''}">Ana Sayfa</a>
        <a href="kiralik.html"    class="${mevcutSayfa === 'kiralik.html'    ? 'active' : ''}">Kiralık</a>
        <a href="satilik.html"    class="${mevcutSayfa === 'satilik.html'    ? 'active' : ''}">Satılık</a>
        <a href="iletisim.html"   class="${mevcutSayfa === 'iletisim.html'   ? 'active' : ''}">İletişim</a>
        <a href="hakkimizda.html" class="${mevcutSayfa === 'hakkimizda.html' ? 'active' : ''}">Hakkımızda</a>
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
          <img src="logo.jpeg" alt="Logo" class="logo-img" style="margin-bottom:10px;">
          <p>Hayalinizdeki evi bulmanız için güvenilir, hızlı ve profesyonel hizmet.</p>
        </div>
        <div class="footer-col">
          <h3>Hızlı Linkler</h3>
          <ul>
            <li><a href="index.html">Ana Sayfa</a></li>
            <li><a href="kiralik.html">Kiralık İlanlar</a></li>
            <li><a href="satilik.html">Satılık İlanlar</a></li>
            <li><a href="iletisim.html">İletişim</a></li>
            <li><a href="hakkimizda.html">Hakkımızda</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>Hizmetlerimiz</h3>
          <ul>
            <li><a href="satilik.html">Konut Satışı</a></li>
            <li><a href="kiralik.html">Konut Kirası</a></li>
            <li><a href="satilik.html">Arsa Satışı</a></li>
            <li><a href="hakkimizda.html">Hakkımızda</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>İletişim</h3>
          <p>📍 Kazım Dirik Mah. Atatürk Cad.<br>No:78/C Aliağa/İzmir</p>
          <p>📞 0232 655 84 84</p>
          <p>📞 0534 540 64 64</p>
          <p>✉️ info@emlakduragi.com</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 Emlak Durağı. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  `;

  document.getElementById('footer-alani').innerHTML = footer;
}

// === HER SAYFADA OTOMATİK ÇALIŞ ===
document.addEventListener('DOMContentLoaded', () => {
  headerYukle();
  footerYukle();
});
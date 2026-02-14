function getBasePath() {
    const path = window.location.pathname;

    // якщо сайт відкритий як github.io/ivachocolate/
    if (path.includes('/ivachocolate/')) {
        return '/ivachocolate';
    }

    return '';
}

function loadHeaderFooter() {
    const base = getBasePath();

    fetch(`${base}/pages/header.html`)
      .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.text();
      })
      .then(data => {
          const headerContainer = document.getElementById("header-placeholder");
          if (headerContainer) {
              headerContainer.innerHTML = data;
              if (typeof initCart === "function") initCart();
              if (typeof updateTexts === "function") updateTexts();
          }
      })
      .catch(err => console.error('Помилка завантаження header:', err));

    fetch(`${base}/pages/footer.html`)
      .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.text();
      })
      .then(data => {
          const footerContainer = document.getElementById("footer-placeholder");
          if (footerContainer) {
              footerContainer.innerHTML = data;
          }
      })
      .catch(err => console.error('Помилка завантаження footer:', err))
      .finally(() => {
          if (typeof loadCatalog === "function") loadCatalog();
      });
}

document.addEventListener("DOMContentLoaded", function () {
    loadHeaderFooter();
    if (typeof initSmartSearch === "function") initSmartSearch();
});
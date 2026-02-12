function loadHeaderFooter() {
    console.log('Завантаження header...');
    
    // ✅ ВИПРАВЛЕНО: прибрано / на початку
    fetch('./pages/header.html')
      .then(res => {
          if (!res.ok) throw new Error('Header not found');
          return res.text();
      })
      .then(data => {
        const headerContainer = document.getElementById("header-placeholder");
        if (headerContainer) {
          console.log('✅ header вставлений');
          headerContainer.innerHTML = data;
          if (typeof initCart === "function") initCart();
          if (typeof updateTexts === "function") updateTexts();
        }
      })
      .catch(err => console.error('❌ Помилка header:', err));

    console.log('Завантаження footer...');
    
    // ✅ ВИПРАВЛЕНО: прибрано / на початку
    fetch('./pages/footer.html')
      .then(res => {
          if (!res.ok) throw new Error('Footer not found');
          return res.text();
      })
      .then(data => {
        const footerContainer = document.getElementById("footer-placeholder");
        if (footerContainer) {
          console.log('✅ footer вставлений');
          footerContainer.innerHTML = data;
        }
      })
      .catch(err => console.error('❌ Помилка footer:', err))
      .finally(() => {
          if (typeof loadCatalog === "function") {
              setTimeout(loadCatalog, 100);
          }
      });
}

// ❌❌❌ ВИДАЛІТЬ ЦІ РЯДКИ! ❌❌❌
// Рядки 10 і 24 - просто видаліть їх повністю!
// document.head.insertAdjacentHTML('beforeend', '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'self\'">');

// Підключаємо подію для завантаження header та footer
document.addEventListener("DOMContentLoaded", function () {
    loadHeaderFooter();
    if (typeof initSmartSearch === "function") {
        setTimeout(initSmartSearch, 200);
    }
});
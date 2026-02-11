function loadHeaderFooter() {
    console.log('Завантаження header...');
    fetch('./pages/header.html')
      .then(res => res.text())
      
      .then(data => {
        const headerContainer = document.getElementById("header-placeholder");
        if (headerContainer) {
          console.log('header вставлений');
          headerContainer.innerHTML = data;
          initCart(); // Кошик
          // initSearch(); // 🔍 Ініціалізація пошуку після вставки хедера
          if (typeof updateTexts === "function") updateTexts(); // i18n
        }
      });

    console.log('Завантаження footer...');
    fetch('./pages/footer.html')
      .then(res => res.text())
      .then(data => {
        const footerContainer = document.getElementById("footer-placeholder");
        if (footerContainer) {
          console.log('footer вставлений');
          footerContainer.innerHTML = data;
        }
      })
      .finally(() => {
          // Викликаємо функцію для ініціалізації каталогу після завантаження header та footer
          loadCatalog();
      });
}

// Підключаємо подію для завантаження header та footer після того, як DOM буде готовий
document.addEventListener("DOMContentLoaded", function () {
    loadHeaderFooter();
    initSmartSearch(); 
});
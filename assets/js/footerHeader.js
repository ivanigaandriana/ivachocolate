function loadHeaderFooter() {
    const repo = '/ivachocolate'; // обов’язково вказати назву репозиторію

    fetch(`${repo}/pages/header.html`)
      .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.text();
      })
      .then(data => {
          const headerContainer = document.getElementById("header-placeholder");
          if (headerContainer) {
              headerContainer.innerHTML = data;
              initCart(); // якщо є
              if (typeof updateTexts === "function") updateTexts(); // i18n
          }
      })
      .catch(err => console.error('Помилка завантаження header:', err));

    fetch(`${repo}/pages/footer.html`)
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
          loadCatalog(); // якщо потрібна ініціалізація каталогу
      });
}

document.addEventListener("DOMContentLoaded", function () {
    loadHeaderFooter();
    initSmartSearch(); // якщо потрібен пошук
});
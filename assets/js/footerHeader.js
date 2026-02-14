// ========== footerHeader.js ==========
// Повністю покладається на config.js для роботи зі шляхами

function loadHeaderFooter() {
    // Використовуємо методи з config.js
    const base = window.appConfig?.baseUrl || '';
    
    console.log('📦 loadHeaderFooter: base =', base);

    // Визначаємо глибину вкладеності
    const depth = window.appConfig?.getDepth ? window.appConfig.getDepth() : getDepthFromPath();
    console.log('📦 Глибина вкладеності:', depth);

    // --- 1. Завантаження хедера ---
    const headerPath = getCorrectPath('pages/header.html', depth);
    console.log('📦 Завантаження хедера з:', headerPath);

    fetch(headerPath)
        .then(res => {
            if (!res.ok) throw new Error(`Помилка ${res.status} для ${headerPath}`);
            return res.text();
        })
        .then(data => {
            const headerContainer = document.getElementById("header-placeholder");
            if (headerContainer) {
                headerContainer.innerHTML = data;
                
                // ВАЖЛИВО: Виправляємо шляхи ВСЕРЕДИНІ завантаженого хедера
                fixPathsInHeaderFooter(headerContainer, depth);
                
                if (typeof initCart === "function") initCart();
                if (typeof updateTexts === "function") updateTexts();
            }
        })
        .catch(err => console.error('Помилка завантаження header:', err));

    // --- 2. Завантаження футера ---
    const footerPath = getCorrectPath('pages/footer.html', depth);
    
    fetch(footerPath)
        .then(res => {
            if (!res.ok) throw new Error(`Помилка ${res.status} для ${footerPath}`);
            return res.text();
        })
        .then(data => {
            const footerContainer = document.getElementById("footer-placeholder");
            if (footerContainer) {
                footerContainer.innerHTML = data;
                
                // Виправляємо шляхи у футері
                fixPathsInHeaderFooter(footerContainer, depth);
            }
        })
        .catch(err => console.error('Помилка завантаження footer:', err))
        .finally(() => {
            if (typeof loadCatalog === "function") loadCatalog();
        });
}

// --- Нова функція для отримання правильного шляху ---
function getCorrectPath(relativePath, depth) {
    // Якщо є config.js з його методом
    if (window.appConfig?.getHeaderFooterPath) {
        return window.appConfig.getHeaderFooterPath(relativePath);
    }
    
    // Запасний варіант
    const base = window.appConfig?.baseUrl || '';
    if (base) {
        return base + '/' + relativePath;
    } else {
        return depth > 0 ? '../'.repeat(depth) + relativePath : relativePath;
    }
}

// --- ВИПРАВЛЕНО: Спеціальна функція для header/footer ---
function fixPathsInHeaderFooter(element, depth) {
    if (!element) return;
    
    console.log('🔧 Виправляємо шляхи в header/footer, depth =', depth);
    
    // Створюємо правильний префікс
    const prefix = getCorrectPrefix(depth);
    
    // Виправляємо посилання - тільки ті, що починаються з pages/ або foto/
    element.querySelectorAll('a[href^="pages/"], a[href^="foto/"]').forEach(link => {
        const originalHref = link.getAttribute('href');
        // НЕ додаємо зайвий pages/, якщо він вже є
        if (originalHref.startsWith('pages/')) {
            link.href = prefix + originalHref;
            console.log(`  a: ${originalHref} → ${link.href}`);
        }
    });

    // Виправляємо зображення
    element.querySelectorAll('img[src^="foto/"]').forEach(img => {
        const originalSrc = img.getAttribute('src');
        img.src = prefix + originalSrc;
        console.log(`  img: ${originalSrc} → ${img.src}`);
    });

    // Виправляємо посилання на головну
    element.querySelectorAll('a[href="index.html"]').forEach(link => {
        link.href = prefix + 'index.html';
        console.log(`  home: index.html → ${link.href}`);
    });
}

// --- Функція для отримання правильного префікса ---
function getCorrectPrefix(depth) {
    // Якщо є baseUrl (GitHub Pages)
    if (window.appConfig?.baseUrl) {
        return window.appConfig.baseUrl + '/';
    }
    
    // Для локального/Render - додаємо ../ тільки якщо глибина > 0
    return depth > 0 ? '../'.repeat(depth) : '';
}

// --- Функція для визначення глибини з URL ---
function getDepthFromPath() {
    const path = window.location.pathname;
    // Видаляємо базовий шлях якщо є
    let relativePath = path.replace(window.appConfig?.baseUrl || '', '');
    // Видаляємо початковий слеш
    relativePath = relativePath.replace(/^\//, '');
    
    if (!relativePath || relativePath === 'index.html') {
        return 0; // Корінь
    }
    
    // Рахуємо кількість слешів
    const matches = relativePath.match(/\//g);
    return matches ? matches.length : 0;
}

// --- Запуск після завантаження DOM ---
document.addEventListener("DOMContentLoaded", function () {
    // Невелика затримка, щоб config.js точно встиг завантажитись
    setTimeout(() => {
        loadHeaderFooter();
        if (typeof initSmartSearch === "function") initSmartSearch();
    }, 50);
});
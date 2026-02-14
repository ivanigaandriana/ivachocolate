(function() {
    window.appConfig = {
        // Автоматичне визначення платформи
        platform: (function() {
            const host = window.location.host;
            if (host.includes('github.io')) return 'github';
            if (host.includes('onrender.com')) return 'render';
            if (host.includes('localhost') || host.includes('127.0.0.1')) return 'local';
            return 'other';
        })(),

        // Базовий URL
        get baseUrl() {
            return this.platform === 'github' ? '/ivachocolate' : '';
        },

        // Формування шляху до файлів
        getPath: function(relativePath) {
            const base = this.baseUrl;
            const cleanPath = relativePath.replace(/^(\.\.\/)+/, '');
            return base ? base + '/' + cleanPath : relativePath;
        },

        // Шляхи для header/footer
        getHeaderFooterPath: function(relativePath) {
            const depth = (window.location.pathname.replace(this.baseUrl, '').match(/\//g) || []).length;
            if (this.baseUrl) return this.baseUrl + '/' + relativePath.replace(/^(\.\.\/)+/, '');
            return '../'.repeat(depth) + relativePath;
        },

        // Шлях до JSON
        getJsonPath: function() {
            const depth = (window.location.pathname.replace(this.baseUrl, '').match(/\//g) || []).length;
            return this.baseUrl ? this.baseUrl + '/data/product.json' : '../'.repeat(depth) + 'data/product.json';
        }
    };

    // Глобальні допоміжні функції
    window.$path = function(relativePath) {
        return window.appConfig.getPath(relativePath);
    };

    window.$debug = function() {
        console.log('🔧 Платформа:', window.appConfig.platform);
        console.log('🔧 Base URL:', window.appConfig.baseUrl);
        console.log('🔧 Приклад шляху до JSON:', window.appConfig.getJsonPath());
    };

    // ======================= Функція виправлення всіх шляхів =======================
    function fixAllPaths() {
        const base = window.appConfig.baseUrl;
        if (!base) {
            console.log('📌 Локальний режим: шляхи не змінюємо');
            return;
        }

        console.log('🔄 Виправляємо шляхи для GitHub Pages...');

        // Виправляємо посилання
        document.querySelectorAll('a').forEach(link => {
            let href = link.getAttribute('href');
            if (!href) return;
            if (href.startsWith('pages/') || href === 'index.html' || href.startsWith('../')) {
                const cleanHref = href.replace(/^(\.\.\/)+/, '');
                link.href = base + '/' + cleanHref;
            }
        });

        // Виправляємо зображення
        document.querySelectorAll('img').forEach(img => {
            let src = img.getAttribute('src');
            if (!src) return;
            if (src.startsWith('foto/') || src.startsWith('../')) {
                const cleanSrc = src.replace(/^(\.\.\/)+/, '');
                img.src = base + '/' + cleanSrc;
            }
        });

        // Виправляємо CSS
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            let href = link.getAttribute('href');
            if (!href) return;
            if (href.startsWith('assets/') || href.startsWith('./assets/') || href.startsWith('../')) {
                const cleanHref = href.replace(/^(\.\.\/)+/, '').replace('./', '');
                link.href = base + '/' + cleanHref;
            }
        });

        // Виправляємо JS
        document.querySelectorAll('script[src]').forEach(script => {
            let src = script.getAttribute('src');
            if (!src) return;
            if (src.startsWith('assets/') || src.startsWith('./assets/') || src.startsWith('../')) {
                const cleanSrc = src.replace(/^(\.\.\/)+/, '').replace('./', '');
                script.src = base + '/' + cleanSrc;
            }
        });

        console.log('✅ Всі шляхи виправлені!');
    }

    // ======================= Запуск після завантаження сторінки =======================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixAllPaths);
    } else {
        fixAllPaths();
    }
    window.addEventListener('load', fixAllPaths);
    window.addEventListener('load', window.$debug);
})();
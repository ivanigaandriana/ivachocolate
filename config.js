// ========== УНІВЕРСАЛЬНИЙ КОНФІГ ==========
// Працює на: GitHub Pages, Render, локальному сервері
// Автоматично визначає платформу і підставляє правильні шляхи

(function() {
    window.appConfig = {
        // Визначаємо платформу автоматично
        platform: (function() {
            const host = window.location.host;
            const path = window.location.pathname;
            
            // GitHub Pages
            if (host.includes('github.io')) {
                console.log('✅ Платформа: GitHub Pages');
                return 'github';
            }
            
            // Render
            if (host.includes('onrender.com')) {
                console.log('✅ Платформа: Render');
                return 'render';
            }
            
            // Локальний сервер (localhost, 127.0.0.1)
            if (host.includes('localhost') || host.includes('127.0.0.1')) {
                console.log('✅ Платформа: Локальний сервер');
                return 'local';
            }
            
            // Інше (можливо, користувацький домен)
            console.log('✅ Платформа: Інша (користувацький домен)');
            return 'other';
        })(),
        
        // Базовий URL для кожної платформи
        get baseUrl() {
            switch(this.platform) {
                case 'github':
                    return '/ivachocolate';  // для GitHub Pages
                case 'render':
                case 'local':
                case 'other':
                default:
                    return '';  // для Render та локального сервера
            }
        },
        
        // Головний метод для отримання правильного шляху
        getPath: function(relativePath) {
            const base = this.baseUrl;
            
            // Видаляємо всі ../ з початку (для файлів в підпапках)
            let cleanPath = relativePath.replace(/^(\.\.\/)+/, '');
            
            // Для GitHub Pages додаємо /ivachocolate/
            if (base) {
                // Перевіряємо, чи шлях вже не містить baseUrl
                if (!cleanPath.startsWith(base.replace('/', ''))) {
                    return base + '/' + cleanPath;
                }
                return base + '/' + cleanPath;
            }
            
            // Для Render та локального - повертаємо оригінальний шлях
            return relativePath;
        },
        
        // Для зображень та файлів (те саме що getPath)
        getSrc: function(relativePath) {
            return this.getPath(relativePath);
        },
        
        // Для посилань на сторінки
        getHref: function(relativePath) {
            return this.getPath(relativePath);
        },
        
        // Допоміжна функція для визначення поточної глибини папки
        getDepth: function() {
            const path = window.location.pathname;
            // Видаляємо базовий шлях якщо є
            let relativePath = path.replace(this.baseUrl, '');
            // Рахуємо кількість слешів (рівнів вкладеності)
            const depth = (relativePath.match(/\//g) || []).length;
            return depth;
        },
        
        // Функція для виправлення шляхів для footerHeader.js
        getHeaderFooterPath: function(relativePath) {
            const depth = this.getDepth();
            const base = this.baseUrl;
            
            if (base) {
                // GitHub Pages
                const cleanPath = relativePath.replace(/^(\.\.\/)+/, '');
                return base + '/' + cleanPath;
            } else {
                // Render та локально - додаємо ../ відповідно до глибини
                return '../'.repeat(depth) + relativePath;
            }
        }
    };
    
    // Додаємо глобальну функцію для зручності
    window.$path = function(relativePath) {
        return window.appConfig.getPath(relativePath);
    };
    
    // Додаємо функцію для консолі (для відладки)
    window.$debug = function() {
        console.log('🔧 Поточна платформа:', window.appConfig.platform);
        console.log('🔧 Base URL:', window.appConfig.baseUrl);
        console.log('🔧 Глибина вкладеності:', window.appConfig.getDepth());
        console.log('🔧 Приклад шляху до фото:', window.$path('foto/лого.png'));
        console.log('🔧 Приклад шляху для header:', window.appConfig.getHeaderFooterPath('pages/header.html'));
    };
    
    // ========== АВТОМАТИЧНЕ ВИПРАВЛЕННЯ ВСІХ ШЛЯХІВ ==========
    function fixAllPaths() {
        const base = window.appConfig.baseUrl;
        
        // Якщо не GitHub Pages - нічого не міняємо
        if (!base) {
            console.log('📌 Локальний режим: шляхи не змінюємо');
            return;
        }
        
        console.log('🔄 Виправляємо шляхи для GitHub Pages...');
        
        // 1. Виправляємо ВСІ посилання
        document.querySelectorAll('a').forEach(link => {
            let href = link.getAttribute('href');
            if (!href) return;
            
            // Посилання на сторінки в папці pages
            if (href.startsWith('pages/')) {
                link.href = base + '/' + href;
            }
            // Посилання на головну
            else if (href === 'index.html') {
                link.href = base + '/index.html';
            }
            // Посилання з ../
            else if (href.startsWith('../')) {
                let cleanHref = href.replace(/^(\.\.\/)+/, '');
                if (!cleanHref.startsWith('http')) {
                    link.href = base + '/' + cleanHref;
                }
            }
        });
        
        // 2. Виправляємо ВСІ зображення
        document.querySelectorAll('img').forEach(img => {
            let src = img.getAttribute('src');
            if (!src) return;
            
            // Зображення в папці foto
            if (src.startsWith('foto/')) {
                img.src = base + '/' + src;
            }
            // Зображення з ../
            else if (src.startsWith('../')) {
                let cleanSrc = src.replace(/^(\.\.\/)+/, '');
                img.src = base + '/' + cleanSrc;
            }
        });
        
        // 3. Виправляємо CSS файли
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            let href = link.getAttribute('href');
            if (!href) return;
            
            if (href.startsWith('assets/') || href.startsWith('./assets/')) {
                link.href = base + '/' + href.replace('./', '');
            }
            else if (href.startsWith('../')) {
                let cleanHref = href.replace(/^(\.\.\/)+/, '');
                link.href = base + '/' + cleanHref;
            }
        });
        
        // 4. Виправляємо JavaScript файли
        document.querySelectorAll('script[src]').forEach(script => {
            let src = script.getAttribute('src');
            if (!src) return;
            
            if (src.startsWith('assets/') || src.startsWith('./assets/')) {
                script.src = base + '/' + src.replace('./', '');
            }
            else if (src.startsWith('../')) {
                let cleanSrc = src.replace(/^(\.\.\/)+/, '');
                script.src = base + '/' + cleanSrc;
            }
        });
        
        console.log('✅ Всі шляхи виправлені!');
    }
    
    // Запускаємо виправлення після повного завантаження сторінки
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixAllPaths);
    } else {
        // Якщо DOM вже завантажений
        fixAllPaths();
    }
    
    // Також запускаємо після повного завантаження (для динамічних елементів)
    window.addEventListener('load', fixAllPaths);
    
    // Автоматично виводимо інформацію в консоль при завантаженні
    console.log('🚀 Config.js завантажено!');
    window.$debug();
})();
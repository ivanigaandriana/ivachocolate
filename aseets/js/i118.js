document.addEventListener("DOMContentLoaded", function () {
    i18next.init({
        lng: 'en', // Початкова мова
        debug: true, // Включає логування в консоль
        resources: {
            en: {
                translation: {
                    "hello": "Hello",
                    "welcome": "Welcome to our website",
                    "about": "About Us",
                    "contact": "Contacts",
                    "delivery": "Delivery and Payment",
                    "search_placeholder": "Search...",
                    "cart": "Cart"
                }
            },
            cs: {
                translation: {
                    "hello": "Ahoj",
                    "welcome": "Vítejte na našem webu",
                    "about": "O nás",
                    "contact": "Kontakty",
                    "delivery": "Doprava a platba",
                    "search_placeholder": "Hledat...",
                    "cart": "Košík"
                }
            },
            uk: {
                translation: {
                    "hello": "Привіт",
                    "welcome": "Ласкаво просимо на наш сайт",
                    "about": "Про нас",
                    "contact": "Контакти",
                    "delivery": "Доставка та оплата",
                    "search_placeholder": "Пошук...",
                    "cart": "Кошик"
                }
            }
        }
    }, function (err, t) {
        updateTexts(); // Оновлення тексту після ініціалізації
    });

    // Функція зміни мови
    function changeLanguage(language) {
        i18next.changeLanguage(language, function (err, t) {
            if (err) return console.error("Language change error:", err);
            updateTexts(); // Оновити всі тексти на сторінці
        });
    }

    // Оновлення всіх елементів з атрибутом data-i18n
    function updateTexts() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            el.textContent = i18next.t(key);
        });

        // Оновлення плейсхолдера для пошуку
        document.getElementById("search").setAttribute("placeholder", i18next.t("search_placeholder"));
    }

    // Додаємо обробники подій для кнопок зміни мови
    document.getElementById('change-en').addEventListener('click', () => changeLanguage('en'));
    document.getElementById('change-cs').addEventListener('click', () => changeLanguage('cs'));
    document.getElementById('change-uk').addEventListener('click', () => changeLanguage('uk'));
});
function updateTexts() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = i18next.t(key);
    });

    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.setAttribute("placeholder", i18next.t("search_placeholder"));
    }
}
document.addEventListener("DOMContentLoaded", function () {
    const changeEnBtn = document.getElementById('change-en');
    const changeCsBtn = document.getElementById('change-cs');
    const changeUkBtn = document.getElementById('change-uk');

    if (changeEnBtn && changeCsBtn && changeUkBtn) {
        const savedLang = localStorage.getItem("lang") || "en";

        i18next.init({
            lng: savedLang,
            debug: true,
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
            if (err) return console.error("Translation initialization failed:", err);
            updateTexts(); // Тепер доступна тут
        });

        function changeLanguage(language) {
            i18next.changeLanguage(language, function (err, t) {
                if (err) return console.error("Language change error:", err);
                localStorage.setItem("lang", language);
                updateTexts(); // І тут доступна
            });
        }

        changeEnBtn.addEventListener('click', () => changeLanguage('en'));
        changeCsBtn.addEventListener('click', () => changeLanguage('cs'));
        changeUkBtn.addEventListener('click', () => changeLanguage('uk'));
    } else {
        console.error("Кнопки для зміни мови не знайдено.");
    }
});
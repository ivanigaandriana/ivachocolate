document.addEventListener("DOMContentLoaded", function () {
    const products = [
        "Mléčná čokoláda",
        "Hořká čokoláda",
        "Bílá čokoláda",
        "Čokoládové pralinky",
        "Čokoládová tyčinka",
        "Oříšková čokoláda",
        "Karamelová čokoláda"
    ];

    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");
    const searchButton = document.getElementById("searchBtn");

    if (!searchInput || !resultsDiv || !searchButton) {
        console.error("Помилка: Один із елементів пошуку не знайдено!");
        return;
    }

    function searchProducts() {
        const query = searchInput.value.toLowerCase().trim();
        resultsDiv.innerHTML = ""; // Очищення результатів

        if (query.length === 0) {
            resultsDiv.style.display = "none";
            return;
        }

        const filteredProducts = products.filter(product => product.toLowerCase().includes(query));

        if (filteredProducts.length === 0) {
            resultsDiv.innerHTML = "<div>Товар не знайдено</div>";
        } else {
            filteredProducts.forEach(product => {
                const div = document.createElement("div");
                div.textContent = product;
                div.addEventListener("click", function () {
                    searchInput.value = product; // Вставляємо вибраний товар
                    resultsDiv.style.display = "none"; // Ховаємо результати
                });
                resultsDiv.appendChild(div);
            });
        }

        resultsDiv.style.display = "block"; // Показати результати
    }

    // Викликати пошук при введенні тексту
    searchInput.addEventListener("input", searchProducts);
    searchButton.addEventListener("click", searchProducts);

    // Дозволити пошук клавішею Enter
    searchInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            searchProducts();
        }
    });

    // Сховати список, якщо клікнули поза ним
    document.addEventListener("click", function (event) {
        if (!searchInput.contains(event.target) && !resultsDiv.contains(event.target)) {
            resultsDiv.style.display = "none";
        }
    });
});

    // Ініціалізація зміни мови
    function changeLanguage(language) {
        i18next.changeLanguage(language, function(err, t) {
            if (err) return console.error("Language change error:", err);

            document.querySelectorAll("[data-i18n]").forEach(el => {
                const key = el.getAttribute("data-i18n");
                el.textContent = i18next.t(key);
            });
        });
    }

    document.getElementById('change-en').addEventListener('click', () => changeLanguage('en'));
    document.getElementById('change-cs').addEventListener('click', () => changeLanguage('cs'));
    document.getElementById('change-uk').addEventListener('click', () => changeLanguage('uk'));

  


document.addEventListener("DOMContentLoaded", function () {
    const catalogBtn = document.querySelector(".catalog__btn");
    const catalogMenu = document.querySelector(".catalog__menu");

    if (!catalogBtn || !catalogMenu) return; // Перевірка, чи елементи існують

    catalogBtn.addEventListener("click", function (event) {
        event.stopPropagation(); // Запобігає закриттю при кліку на кнопку
        catalogMenu.style.display = catalogMenu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", function (event) {
        if (!catalogMenu.contains(event.target) && !catalogBtn.contains(event.target)) {
            catalogMenu.style.display = "none";
        }
    });
});



document.addEventListener("DOMContentLoaded", function () {
    const cartBtn = document.getElementById("cart-btn");
    const cartModal = document.getElementById("cart-modal");
    const closeCart = document.querySelector(".close-cart");
    const exitBtn = document.querySelector(".exit-btn");
    const cartItems = document.getElementById("cart-items");
    const totalPrice = document.getElementById("total-price");
    const cartCount = document.getElementById("cart-count");
    const cartCountModal = document.getElementById("cart-count-modal");

    let cart = JSON.parse(localStorage.getItem("cart")) || []; // Завантажуємо кошик з localStorage
    updateCart(); // Оновлюємо інтерфейс при завантаженні

    // Відкриття кошика
    cartBtn.addEventListener("click", function () {
        cartModal.style.display = "flex";
    });

    // Закриття кошика при натисканні на хрестик
    closeCart.addEventListener("click", function () {
        cartModal.style.display = "none";
    });

    // Закриття кошика при натисканні поза його межами
    window.addEventListener("click", function (event) {
        if (event.target === cartModal) {
            cartModal.style.display = "none";
        }
    });

    // Кнопка виходу з кошика
    exitBtn.addEventListener("click", function () {
        cartModal.style.display = "none";
    });

    // Обробка кнопок "+" і "-"
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("plus")) {
            const input = event.target.previousElementSibling;
            let quantity = parseInt(input.value);
            input.value = quantity + 1;
        }
        if (event.target.classList.contains("minus")) {
            const input = event.target.nextElementSibling;
            let quantity = parseInt(input.value);
            if (quantity > 1) {
                input.value = quantity - 1;
            }
        }
    });

    // Обробник подій для кнопок "Додати в кошик"
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("add-to-cart")) {
            const productName = event.target.dataset.name;
            const productPrice = parseInt(event.target.dataset.price);
            
            // Перевірка наявності елемента для введення кількості
            const quantityInput = event.target.parentElement.querySelector(".quantity-input");
            let quantity = quantityInput ? parseInt(quantityInput.value) : 1; // Якщо input не знайдено, кількість = 1

            let existingItem = cart.find(item => item.name === productName);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({ name: productName, quantity, price: productPrice });
            }

            saveCart(); // Зберігаємо кошик у localStorage
            updateCart();
        }
    });

    // Оновлення кошика
    function updateCart() {
        cartItems.innerHTML = "";
        let total = 0;
        let itemCount = 0;

        if (cart.length === 0) {
            cartItems.innerHTML = "<p>У кошику немає товарів</p>";
        } else {
            cart.forEach((item, index) => {
                let li = document.createElement("li");
                li.innerHTML = `
                    ${item.name} x${item.quantity} <strong>${item.price * item.quantity} Kč</strong>
                    <button class="remove-item" data-index="${index}">❌</button>
                `;
                cartItems.appendChild(li);
                total += item.price * item.quantity;
                itemCount += item.quantity;
            });
        }

        totalPrice.textContent = total;
        cartCount.textContent = itemCount; // Оновлюємо лічильник біля кошика
        cartCountModal.textContent = itemCount; // Оновлюємо лічильник у модальному вікні
    }

    // Видалення товару з кошика
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("remove-item")) {
            const index = event.target.dataset.index;
            cart.splice(index, 1);
            saveCart();
            updateCart();
        }
    });

    // Збереження кошика у localStorage
    function saveCart() {
        localStorage.setItem("cart", JSON.stringify(cart));
    }
});
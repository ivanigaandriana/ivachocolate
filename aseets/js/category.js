// Завантаження JSON даних про продукти
fetch('/js/product.json')
    .then(response => response.json()) // Перетворюємо JSON у об'єкт
    .then(data => {
        // Викликаємо функцію для створення HTML-коду
        createProductList(data);
    })
    .catch(error => console.error('Помилка завантаження категорії:', error));

// Функція для створення HTML-коду списку продуктів
function createProductList(products) {
    // Отримуємо контейнер для товарів на сторінці
    const productContainer = document.querySelector('.karamel__list'); // або інший елемент, де будуть відображатись товари

    // Перебираємо категорії
    for (const category in products) {
        if (products.hasOwnProperty(category)) {
            const categoryProducts = products[category];
            
            // Для кожної категорії створюємо окрему групу товарів
            categoryProducts.forEach(product => {
                // Створюємо HTML елементи для кожного товару
                const productItem = document.createElement('li');
                productItem.classList.add('karamel__item');

                // Заповнюємо вміст товару
                productItem.innerHTML = `
                    <div class="karamel__box">
                        <a class="karamel__link" href="../pages/product/${product.id}.html">
                            <img src="${product.image}" width="270px" alt="${product.name}">
                        </a>
                    </div>
                    <div class="karamel__text">
                        <h2 class="karamel__title">${product.name}</h2>
                        <p class="karamel__price">${product.price}</p>
                        <button class="add-to-cart" data-name="${product.name}" data-price="${product.price}">Додати в кошик</button>
                    </div>
                `;
                
                // Додаємо товар до списку
                productContainer.appendChild(productItem);
            });
        }
    }
}
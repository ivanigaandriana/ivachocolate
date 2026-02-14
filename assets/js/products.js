document.addEventListener("DOMContentLoaded", function () {
    const categoryElement = document.getElementById("category");
    const categoryName = categoryElement.getAttribute("data-category");

    // 🔧 ДОДАНО: універсальний шлях до JSON
    const baseUrl = window.location.hostname.includes('github.io') ? '/ivachocolate' : '';
    const jsonUrl = baseUrl + '/data/product.json';
    console.log('📦 Завантаження JSON з:', jsonUrl); // для перевірки

    // 🔄 ЗМІНЕНО: використовуємо jsonUrl замість '/data/product.json'
    fetch(jsonUrl)
        .then(response => {
            // 🔧 ДОДАНО: перевірка відповіді
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data[categoryName]) {
                const products = data[categoryName];
                const productList = document.querySelector(".product-list");
                productList.innerHTML = ''; // очищаємо перед додаванням

                products.forEach(product => {
                    const productItem = document.createElement("li");
                    productItem.classList.add("product-item");

                    // 🔧 ДОДАНО: виправлення шляху до зображення
                    const imageUrl = product.image.startsWith('/') 
                        ? baseUrl + product.image 
                        : product.image;

                    // Зображення
                    const productImage = document.createElement("img");
                    productImage.src = imageUrl; // ← використовуємо виправлений шлях
                    productImage.alt = product.name;
                    productImage.width = 270;
                    productImage.classList.add("product-img");

                    // Назва
                    const productTitle = document.createElement("h2");
                    productTitle.textContent = product.name;
                    productTitle.classList.add("product-title");

                    // Опис (короткий)
                    const productDescription = document.createElement("p");
                    productDescription.textContent = product.description;
                    productDescription.classList.add("product-text", "clamp-2");

                    // Ціна
                    const productPrice = document.createElement("p");
                    productPrice.textContent = `${product.price} грн`;
                    productPrice.classList.add("product-price");

                    // Посилання на деталі продукту
                    const productLink = document.createElement("a");
                    productLink.href = `${baseUrl}/pages/productDetails.html?product=${encodeURIComponent(product.name)}`; // ← ДОДАНО encodeURIComponent
                    productLink.textContent = "Детальніше";
                    productLink.classList.add("product-link");

                    // Кнопка "Додати в кошик"
                    const productButton = document.createElement("button");
                    productButton.classList.add("add-to-cart");
                    productButton.setAttribute("data-name", product.name);
                    productButton.setAttribute("data-price", product.price);
                    productButton.setAttribute("data-image", imageUrl); // ← виправлений шлях
                    productButton.textContent = "🛒";

                    // Контейнер для кнопки та лінку
                    const actionsContainer = document.createElement("div");
                    actionsContainer.classList.add("product-actions");
                    actionsContainer.appendChild(productLink);
                    actionsContainer.appendChild(productButton);

                    // Збірка карточки продукту
                    productItem.appendChild(productImage);
                    productItem.appendChild(productTitle);
                    productItem.appendChild(productDescription);
                    productItem.appendChild(productPrice);
                    productItem.appendChild(actionsContainer);

                    // Додаємо продукт до списку
                    productList.appendChild(productItem);
                });
            } else {
                categoryElement.innerHTML = "<p>Ця категорія не знайдена.</p>";
            }
        })
        .catch(error => {
            console.error("❌ Помилка при завантаженні даних:", error);
            document.querySelector(".product-list").innerHTML = 
                `<p style="color: red; padding: 20px;">Помилка: ${error.message}</p>`;
        });
});
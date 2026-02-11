function createProductList(products) {
    const productContainer = document.querySelector('.product-list');

    // Перебираємо категорії
    for (const category in products) {
        if (!products.hasOwnProperty(category)) continue;

        const categoryProducts = products[category];

        categoryProducts.forEach(product => {
            const productItem = document.createElement('li');
            productItem.classList.add('karamel__item');

            // Формуємо правильне посилання з усіма даними
            const productURL = `../pages/productDetails.html?data=${encodeURIComponent(JSON.stringify(product))}`;

            productItem.innerHTML = `
                <div class="karamel__box">
                    <a class="karamel__link" href="${productURL}">
                        <img src="${product.image}" width="270px" alt="${product.name}">
                    </a>
                </div>
                <div class="karamel__text">
                    <h2 class="karamel__title">${product.name}</h2>
                     <p class="karamel__desc clamp-2">
            ${product.description}
        </p>
                    <p class="karamel__price">${product.price} грн</p>
                </div>
            `;

            productContainer.appendChild(productItem);
        });
    }
    }


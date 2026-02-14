function createProductList(products) {
    const productContainer = document.querySelector('.product-list');
    if (!productContainer) return;

    // Отримуємо baseUrl з config
    const baseUrl = window.appConfig?.baseUrl || '';

    for (const category in products) {
        if (!products.hasOwnProperty(category)) continue;

        const categoryProducts = products[category];

        categoryProducts.forEach(product => {
            const productItem = document.createElement('li');
            productItem.classList.add('karamel__item');

            // ✅ ВИПРАВЛЕНО: передаємо тільки назву товару в параметрі "product"
            const productURL = baseUrl + '/pages/productDetails.html?product=' + encodeURIComponent(product.name);

            // Виправляємо шлях до зображення
            const imageUrl = product.image.startsWith('/') 
                ? baseUrl + product.image 
                : product.image;

            productItem.innerHTML = `
                <div class="karamel__box">
                    <a class="karamel__link" href="${productURL}">
                        <img src="${imageUrl}" width="270px" alt="${product.name}">
                    </a>
                </div>
                <div class="karamel__text">
                    <h2 class="karamel__title">${product.name}</h2>
                    <p class="karamel__desc clamp-2">${product.description}</p>
                    <p class="karamel__price">${product.price} грн</p>
                </div>
            `;

            productContainer.appendChild(productItem);
        });
    }
}


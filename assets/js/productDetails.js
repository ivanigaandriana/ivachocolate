// Отримуємо назву товару з URL
const urlParams = new URLSearchParams(window.location.search);
const productName = decodeURIComponent(urlParams.get("product"));

if (!productName) {
    document.getElementById("product-details").innerHTML =
        "<p>Не вказано ім'я продукту в URL.</p>";
} else {
    // ✅ ВИКОРИСТОВУЄМО CONFIG для правильного шляху до JSON
    let jsonUrl;
    
    if (window.appConfig) {
        jsonUrl = window.appConfig.getJsonPath();
        console.log('📦 JSON шлях (з config):', jsonUrl);
    } else {
        // Запасний варіант
        const baseUrl = window.location.hostname.includes('github.io') ? '/ivachocolate' : '';
        jsonUrl = baseUrl + '/data/product.json';
        console.log('⚠️ config не знайдено, використовуємо:', jsonUrl);
    }
    
    fetch(jsonUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP помилка! Статус: ${response.status}`);
            return response.json();
        })
        .then(data => {
            let product = null;

            // Пошук товару в усіх категоріях
            for (const category of Object.keys(data)) {
                if (Array.isArray(data[category])) {
                    product = data[category].find(p =>
                        p.name.toLowerCase().trim() === productName.toLowerCase().trim()
                    );
                    if (product) {
                        console.log(`✅ Товар знайдено в категорії: ${category}`);
                        break;
                    }
                }
            }

            if (product) {
                // ✅ ВИПРАВЛЯЄМО ШЛЯХИ ДО ЗОБРАЖЕНЬ
                function fixImagePath(imagePath) {
                    if (!imagePath) return window.appConfig?.baseUrl + '/foto/лого2.png';
                    if (imagePath.startsWith('http')) return imagePath;
                    
                    const baseUrl = window.appConfig?.baseUrl || '';
                    
                    // Виправляємо "aseets" на правильний шлях
                    let fixedPath = imagePath;
                    if (fixedPath.includes('aseets')) {
                        fixedPath = fixedPath.replace('aseets', 'assets');
                    }
                    
                    // Додаємо baseUrl для абсолютних шляхів
                    if (fixedPath.startsWith('/')) {
                        return baseUrl + fixedPath;
                    }
                    
                    return fixedPath;
                }
                
                const mainImage = fixImagePath(product.image); // ГОЛОВНЕ ФОТО
                const gallery = (product.additional_images || []).map(img => fixImagePath(img));

                document.getElementById("product-details").innerHTML = `
                    <div class="product-details-content">
                        <div class="product-image">
                            <img src="${mainImage}" alt="${product.name}" width="370">
                        </div>

                        <div class="product-details-box">
                            <h2 class="product-title">${product.name}</h2>

                            <p class="product-text full-text"><strong>Опис:</strong> ${product.description}</p>
                            <p class="product-text"><strong>Інгредієнти:</strong> ${product.ingredients}</p>
                            <p class="product-text"><strong>Термін зберігання:</strong> ${product.storage}</p>
                            <p class="product-text"><strong>Вага:</strong> ${product.weight}</p>
                            <p class="product-price"><strong>Ціна:</strong> ${product.price} Kč</p>

                            <div class="quantity">
                                <button class="minus">-</button>
                                <input type="text" class="quantity-input" value="1">
                                <button class="plus">+</button>
                            </div>

                            <button 
                                class="add-to-cart"
                                data-name="${product.name}"
                                data-price="${product.price}"
                                data-image="${mainImage}">
                                Додати в кошик
                            </button>
                        </div>
                    </div>

                    <div class="product-gallery">
                        ${gallery.map(img => `<img src="${img}" class="thumb" width="100">`).join("")}
                    </div>
                `;
                
                // ✅ ІНІЦІАЛІЗУЄМО ГАЛЕРЕЮ
                initGallery();
            } else {
                document.getElementById("product-details").innerHTML =
                    "<p>Продукт не знайдено.</p>";
            }
        })
        .catch(error => {
            console.error("❌ Помилка завантаження JSON:", error);
            document.getElementById("product-details").innerHTML =
                "<p>Сталася помилка при завантаженні даних. Спробуйте пізніше.</p>";
        });
}

// ========== ГАЛЕРЕЯ ==========
let currentImages = [];
let currentIndex = 0;

function initGallery() {
    // Видаляємо старі обробники, щоб не дублювалися
    document.removeEventListener("click", handleGalleryClick);
    document.addEventListener("click", handleGalleryClick);
}

function handleGalleryClick(e) {
    if (e.target.classList.contains("thumb")) {
        currentImages = [...document.querySelectorAll(".thumb")].map(img => img.src);
        currentIndex = currentImages.indexOf(e.target.src);
        openImageModal();
    }
}

function openImageModal() {
    const modal = document.getElementById("image-modal");
    if (!modal) return;
    
    const modalImg = modal.querySelector(".modal-image");
    modalImg.src = currentImages[currentIndex];
    modal.style.display = "flex";
}

function closeImageModal() {
    const modal = document.getElementById("image-modal");
    if (modal) modal.style.display = "none";
}

// ========== ОБРОБНИКИ МОДАЛКИ ==========
document.addEventListener("DOMContentLoaded", function() {
    // Закриття модалки
    const closeBtn = document.querySelector(".close-modal");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeImageModal);
    }
    
    // Стрілки
    const nextArrow = document.querySelector(".modal-arrow.next");
    if (nextArrow) {
        nextArrow.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % currentImages.length;
            const modalImg = document.querySelector(".modal-image");
            if (modalImg) modalImg.src = currentImages[currentIndex];
        });
    }
    
    const prevArrow = document.querySelector(".modal-arrow.prev");
    if (prevArrow) {
        prevArrow.addEventListener("click", () => {
            currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
            const modalImg = document.querySelector(".modal-image");
            if (modalImg) modalImg.src = currentImages[currentIndex];
        });
    }
    
    // Клік по фону
    const modal = document.getElementById("image-modal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target.id === "image-modal") closeImageModal();
        });
    }
});
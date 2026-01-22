const urlParams = new URLSearchParams(window.location.search);
const productName = decodeURIComponent(urlParams.get("product"));

if (!productName) {
    document.getElementById("product-details").innerHTML =
        "<p>Не вказано ім'я продукту в URL.</p>";
} else {
    fetch('../data/product.json')
        .then(response => response.json())
        .then(data => {
            let product = null;

            // Пошук товару в усіх категоріях
            for (const category of Object.keys(data)) {
                product = data[category].find(p =>
                    p.name.toLowerCase().trim() === productName.toLowerCase().trim()
                );
                if (product) break;
            }

            if (product) {
                const mainImage = product.image; // ГОЛОВНЕ ФОТО
                const gallery = product.additional_images || [];

                document.getElementById("product-details").innerHTML = `
                    <div class="product-details-content">
                        <div class="product-image">
                            <img src="${mainImage}" alt="${product.name}" width="370">
                        </div>

                        <div class="product-details-box">
                            <h2 class="product-title">${product.name}</h2>

                            <p class="product-text"><strong>Опис:</strong> ${product.description}</p>
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
            } else {
                document.getElementById("product-details").innerHTML =
                    "<p>Продукт не знайдено.</p>";
            }
        })
        .catch(error => {
            console.error("Помилка завантаження JSON:", error);
            document.getElementById("product-details").innerHTML =
                "<p>Сталася помилка при завантаженні даних.</p>";
        });
}
let currentImages = [];
let currentIndex = 0;

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("thumb")) {
    currentImages = [...document.querySelectorAll(".thumb")].map(img => img.src);
    currentIndex = currentImages.indexOf(e.target.src);

    openImageModal();
  }
});

function openImageModal() {
  const modal = document.getElementById("image-modal");
  const modalImg = modal.querySelector(".modal-image");

  modalImg.src = currentImages[currentIndex];
  modal.style.display = "flex";
}

function closeImageModal() {
  document.getElementById("image-modal").style.display = "none";
}

document.querySelector(".close-modal").addEventListener("click", closeImageModal);

document.querySelector(".modal-arrow.next").addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % currentImages.length;
  document.querySelector(".modal-image").src = currentImages[currentIndex];
});

document.querySelector(".modal-arrow.prev").addEventListener("click", () => {
  currentIndex =
    (currentIndex - 1 + currentImages.length) % currentImages.length;
  document.querySelector(".modal-image").src = currentImages[currentIndex];
});

document.getElementById("image-modal").addEventListener("click", (e) => {
  if (e.target.id === "image-modal") closeImageModal();
});
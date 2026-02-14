function initSmartSearch() {
    const jsonPath = window.appConfig.getJsonPath();
    console.log('📦 Завантаження JSON з:', jsonPath);

    fetch(jsonPath)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP помилка! Статус: ${res.status}`);
            return res.json();
        })
        .then(data => {
           console.log("✅ JSON завантажено:", data);
            const searchInput = document.getElementById("search");
            const searchButton = document.getElementById("searchBtn");
            if (!searchInput || !searchButton) return;

            const transliterate = (text) => {
                const map = {
                    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','є':'ye','ж':'zh',
                    'з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m',
                    'н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
                    'х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ю':'yu','я':'ya',
                    'a':'а','b':'б','c':'ц','d':'д','e':'е','f':'ф','g':'г','h':'х',
                    'i':'і','j':'й','k':'к','l':'л','m':'м','n':'н','o':'о','p':'п',
                    'q':'к','r':'р','s':'с','t':'т','u':'у','v':'в','w':'в','x':'кс',
                    'y':'и','z':'з'
                };
                return text.split('').map(char => map[char] || char).join('');
            };

            const performSearch = () => {
                const query = searchInput.value.trim().toLowerCase();
                if (!query) return;

                for (const category in data) {
                    for (const product of data[category]) {
                        const productName = product.name.toLowerCase();
                        if (productName.includes(query) || transliterate(productName).includes(query)) {
                            console.log("🔎 Знайдено:", product.name);
                            window.location.href = window.appConfig.getHeaderFooterPath(`pages/categoryPages/${category}.html`);
                            return;
                        }
                    }
                }
                alert("Нічого не знайдено");
            };

            searchButton.addEventListener("click", performSearch);
            searchInput.addEventListener("keypress", (e) => { if (e.key === "Enter") performSearch(); });
        })
        .catch(error => console.error("❌ Помилка при завантаженні JSON:", error));
}
// ==========================
// Каталог
// ==========================
function loadCatalog() {
  const catalogBtn = document.querySelector(".catalog__btn");
  const catalogMenu = document.querySelector(".catalog__menu");

  if (catalogBtn && catalogMenu) {
    catalogBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      catalogMenu.style.display = catalogMenu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", function (event) {
      if (!catalogMenu.contains(event.target) && !catalogBtn.contains(event.target)) {
        catalogMenu.style.display = "none";
      }
    });

    console.log('Каталог ініціалізовано');
  } else {
    console.error('Не вдалося знайти елементи каталогу');
  }
}

// ==========================
// Ініціалізація Кошика
// ==========================
function initCart() {
  const cartBtn = document.getElementById("cart-btn");
  const cartModal = document.getElementById("cart-modal");
  const closeCart = document.querySelector(".close-cart");
  const exitBtn = document.querySelector(".exit-btn");
  const cartItems = document.getElementById("cart-items");
  const totalPrice = document.getElementById("total-price");
  const cartCount = document.getElementById("cart-count");
  const cartCountModal = document.getElementById("cart-count-modal");

  // ==========================
  // Головний кошик
  // ==========================
  window.cart = JSON.parse(localStorage.getItem("cart")) || [];

  // очищуємо некоректні елементи
  window.cart = window.cart.filter(item => {
    if (!item) return false;
    if (item.type === 'custom_box') return item.name && !isNaN(item.price);
    return item.name && !isNaN(item.price);
  });

  saveCart();
  updateCart();

  // ==========================
  // Відкриття / закриття кошика
  // ==========================
  if (cartBtn) cartBtn.addEventListener("click", () => cartModal.style.display = "flex");
  if (closeCart) closeCart.addEventListener("click", () => cartModal.style.display = "none");
  if (exitBtn) exitBtn.addEventListener("click", () => cartModal.style.display = "none");

  window.addEventListener("click", (event) => { if (event.target === cartModal) cartModal.style.display = "none"; });

  // ==========================
  // Checkout
  // ==========================
  const checkoutBtn = document.querySelector(".checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (window.cart.length === 0) {
        alert("Ваш кошик порожній!");
        return;
      }
      cartModal.style.display = "none";
      window.location.href = "/pages/checkout.html";
    });
  }

  // ==========================
  // Події на + / - / видалення / add-to-cart
  // ==========================
  document.addEventListener("click", function (event) {
    // + / -
    if (event.target.classList.contains("plus")) {
      const input = event.target.previousElementSibling;
      if (input) input.value = parseInt(input.value || 0) + 1;
    }
    if (event.target.classList.contains("minus")) {
      const input = event.target.nextElementSibling;
      if (input) input.value = Math.max(1, parseInt(input.value || 1) - 1);
    }

    // Видалення
    if (event.target.classList.contains("remove-item")) {
      const index = event.target.dataset.index;
      window.cart.splice(index, 1);
      saveCart();
      updateCart();
    }

    // Додавання у кошик
    if (event.target.classList.contains("add-to-cart")) {
      event.preventDefault();
      const isCustomBox = event.target.dataset.type === 'custom_box';

     if (isCustomBox) {

  const baseBoxPrice = Number(assembleState.selectedBox.price) || 0;

  const productsTotal = (assembleState.selectedProducts || [])
    .reduce((sum, p) => sum + (Number(p.price) * (Number(p.quantity) || 1)), 0);

  const cardPrice = assembleState.selectedCard
    ? Number(assembleState.selectedCard.price) || 0
    : 0;

  const finalPrice = baseBoxPrice + productsTotal + cardPrice;

  const boxClone = {
    type: "custom_box",
    name: `🎁 БОКС: ${assembleState.selectedBox.name}`,
    quantity: 1,
    price: finalPrice,
    image: assembleState.selectedBox.image || "/foto/logo2.png",

    box: {
      name: assembleState.selectedBox.name,
      capacity: assembleState.selectedBox.capacity || 0,
      price: Number(assembleState.selectedBox.price) || 0
    },

    products: (assembleState.selectedProducts || []).map(p => ({
      name: p.name || "Товар",
      price: Number(p.price) || 0,
      quantity: Number(p.quantity) || 1
    })),

    card: assembleState.selectedCard
      ? {
          name: assembleState.selectedCard.name,
          price: cardPrice
        }
      : null
  };

  window.cart.push(boxClone);
  saveCart();
  updateCart();

  console.log("✅ БОКС ДОДАНО В КОШИК:", boxClone);

  return;
}

      // звичайний товар
      const productName = event.target.dataset.name;
      const productPrice = parseInt(event.target.dataset.price) || 0;
      const productImage = event.target.dataset.image || "/foto/logo2.png";
      const quantityInput = event.target.parentElement.querySelector(".quantity-input");
      const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

      const existingItem = window.cart.find(item => item.name === productName);
      if (existingItem) existingItem.quantity += quantity;
      else window.cart.push({
        name: productName,
        price: productPrice,
        image: productImage,
        quantity
      });

      saveCart();
      updateCart();
    }
  });

  // ==========================
  // Оновлення кошика
  // ==========================
  function updateCart() {
    if (!cartItems) return;
    cartItems.innerHTML = "";
    let total = 0;
    let itemCount = 0;

    if (window.cart.length === 0) {
      cartItems.innerHTML = "<p>🛒 У кошику немає товарів</p>";
    } else {
      window.cart.forEach((item, index) => {
        const li = document.createElement("li");
        if (item.type === 'custom_box') li.innerHTML = renderCustomBoxItemSafe(item, index);
        else li.innerHTML = renderRegularItemSafe(item, index);
        cartItems.appendChild(li);

        total += (item.price || 0) * (item.quantity || 1);
        itemCount += item.quantity || 1;
      });
    }

    totalPrice.textContent = total + " грн";
    cartCount.textContent = itemCount;
    cartCountModal.textContent = itemCount;
  }

  window.updateCart = updateCart;

  // ==========================
  // Збереження кошика
  // ==========================
  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(window.cart));
    console.log("💾 Кошик збережено:", window.cart);
  }

  window.saveCart = saveCart;
}

// ==========================
// Рендеринг товарів
// ==========================
function renderRegularItemSafe(item, index) {
  const name = item.name || 'Без назви';
  const price = item.price || 0;
  const quantity = item.quantity || 1;
  const image = item.image || '/foto/logo2.png';

  return `
    <div style="display: flex; align-items: center; gap: 10px;">
      <img src="${image}" alt="${name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
      <div>
        <div><strong>${name}</strong> x${quantity}</div>
        <div>${price * quantity} грн</div>
      </div>
      <button class="remove-item" data-index="${index}" style="margin-left: auto;">❌</button>
    </div>
  `;
}

function renderCustomBoxItemSafe(item, index) {
  const name = item.name || "🎁 Подарунковий бокс";
  const price = item.price || 0;
  const image = item.image || "/foto/logo2.png";

  const boxName = item.box?.name || "Коробка";
  const capacity = item.box?.capacity || 0;
  const boxPrice = item.box?.price || 0;

  const productsHTML = (item.products || []).map(p => `
    <div class="cart-box-product">
      ▸ ${p.name} × ${p.quantity} — ${p.price * p.quantity} грн
    </div>
  `).join("");

  const cardHTML = item.card
    ? `<div class="cart-box-card">
        🎴 Листівка: ${item.card.name} — ${item.card.price} грн
      </div>`
    : "";

  return `
    <div class="cart-custom-box" style="display: flex; align-items: center; gap: 10px;">
      <img src="${image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">

      <div class="cart-box-info">

        <div class="cart-box-title">${name}</div>

        <div class="cart-box-sub">
          📦 ${boxName} (${capacity} місць) — ${boxPrice} грн
        </div>

        <div class="cart-box-products">
          ${productsHTML}
          ${cardHTML}
        </div>

        <div class="cart-box-price">
          <strong>${price} грн</strong>
        </div>

      </div>

      <button class="remove-item" data-index="${index}">❌</button>
    </div>
  `;
}
// ======================= ЗАПУСК ПІСЛЯ ЗАВАНТАЖЕННЯ DOM =======================
document.addEventListener("DOMContentLoaded", () => {
    initSmartSearch();  // Пошук по JSON
    loadCatalog();      // Каталог
    initCart();         // Кошик
});
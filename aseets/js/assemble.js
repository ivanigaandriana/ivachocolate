 document.addEventListener('DOMContentLoaded', function() {
    console.log('Assemble.js завантажено');
    
    // Стан конструктора
    const assembleState = {
        currentStep: 1,
        selectedBox: null,
        selectedCard: null,
        selectedProducts: [],
        availableProducts: [],
        boxes: [],
        cards: []
    };
window.assembleState = assembleState;
    // DOM елементи
    const elements = {
        boxesList: document.getElementById('boxes-list'),
        productsList: document.getElementById('products-list'),
        cardsList: document.getElementById('cards-list'),
        selectedItems: document.getElementById('selected-items'),
        totalPrice: document.getElementById('total-price'),
        addToCartBtn: document.getElementById('add-to-cart'),
        nextStepBtn: document.getElementById('next-step'),
        prevStepBtn: document.getElementById('prev-step'),
        boxCounter: document.getElementById('box-counter'),
        usedSlots: document.getElementById('used-slots'),
        totalSlots: document.getElementById('total-slots'),
        capacityInfo: document.getElementById('capacity-info'),
        capacityWarning: document.getElementById('capacity-warning'),
        exceededCount: document.getElementById('exceeded-count'),
        changeBoxBtn: document.getElementById('change-box-btn'),
        changeCardBtn: document.getElementById('change-card-btn'),
        skipCardBtn: document.getElementById('skip-card-btn'),
        sections: {
            box: document.getElementById('section-box'),
            products: document.getElementById('section-products'),
            card: document.getElementById('section-card')
        },
        progressSteps: document.querySelectorAll('.progress-step'),
        filterBtns: document.querySelectorAll('.filter-btn')
    };

    // ========== ВСПОМІЖНІ ФУНКЦІЇ ==========

    // Функція для показу сповіщення
    function showAlert(message, type = 'warning', duration = 3000) {
        // Видаляємо старі сповіщення
        const oldAlert = document.querySelector('.overcapacity-alert');
        if (oldAlert) oldAlert.remove();
        
        const alert = document.createElement('div');
        alert.className = `overcapacity-alert ${type}`;
        alert.innerHTML = `
            <strong>${type === 'danger' ? '⚠️ ' : 'ℹ️ '}${message}</strong>
        `;
        
        document.body.appendChild(alert);
        
        // Автоматичне видалення через duration
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.opacity = '0';
                alert.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (alert.parentNode) alert.remove();
                }, 500);
            }
        }, duration);
        
        return alert;
    }

    // Функція для перевірки місткості
    function checkCapacity() {
        if (!assembleState.selectedBox) return { isValid: false, total: 0, remaining: 0, exceeded: 0 };
        
        const totalItems = assembleState.selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
        const remaining = assembleState.selectedBox.capacity - totalItems;
        const exceeded = Math.max(0, totalItems - assembleState.selectedBox.capacity);
        
        return {
            isValid: exceeded === 0,
            total: totalItems,
            remaining: remaining,
            exceeded: exceeded
        };
    }

    // Функція для оновлення інформації про місткість
    function updateCapacityInfo() {
        if (!elements.capacityInfo) return;
        
        const capacity = checkCapacity();
        
        if (!assembleState.selectedBox) {
            elements.capacityInfo.innerHTML = '';
            elements.capacityInfo.className = 'capacity-info';
            return;
        }
        
        let html = '';
        let className = 'capacity-info';
        
        if (capacity.exceeded > 0) {
            // Перевищено місткість
            className += ' danger';
            html = `
                ⚠️ <strong>Увага!</strong> Перевищено місткість на ${capacity.exceeded} товарів<br>
                <small>Видаліть ${capacity.exceeded} товар(ів) або змініть коробку</small>
            `;
            
            // Показуємо попередження в заголовку
            if (elements.capacityWarning && elements.exceededCount) {
                elements.capacityWarning.style.display = 'inline';
                elements.exceededCount.textContent = capacity.exceeded;
            }
            
            // Блокуємо кнопку додавання в кошик
            if (elements.addToCartBtn) {
                elements.addToCartBtn.disabled = true;
                elements.addToCartBtn.title = 'Видаліть зайві товари або змініть коробку';
            }
            
        } else {
            // Все добре або ще є місце
            if (capacity.remaining > 0) {
                className += ' good';
                html = `
                    ✅ Можна додати ще ${capacity.remaining} товар(ів)<br>
                    <small>Загалом: ${capacity.total} з ${assembleState.selectedBox.capacity}</small>
                `;
            } else if (capacity.total === assembleState.selectedBox.capacity) {
                className += ' warning';
                html = `
                    ⚠️ Коробка заповнена!<br>
                    <small>Можна видалити товари або змінити коробку</small>
                `;
            }
            
            // Ховаємо попередження
            if (elements.capacityWarning) {
                elements.capacityWarning.style.display = 'none';
            }
            
            // Активуємо кнопку додавання в кошик
            if (elements.addToCartBtn && capacity.total > 0) {
                elements.addToCartBtn.disabled = false;
                elements.addToCartBtn.title = '';
            }
        }
        
        elements.capacityInfo.innerHTML = html;
        elements.capacityInfo.className = className;
        
        // Оновлюємо лічильник слотів
        if (elements.usedSlots && elements.totalSlots) {
            elements.usedSlots.textContent = capacity.total;
            elements.totalSlots.textContent = assembleState.selectedBox.capacity;
            
            if (capacity.exceeded > 0) {
                elements.usedSlots.style.color = '#ff4757';
            } else if (capacity.remaining === 0) {
                elements.usedSlots.style.color = '#ffa502';
            } else {
                elements.usedSlots.style.color = '#2ed573';
            }
        }
        
        // Показуємо/ховаємо кнопку зміни коробки
        if (elements.changeBoxBtn) {
            if (assembleState.selectedBox && capacity.total > 0) {
                elements.changeBoxBtn.style.display = 'inline-block';
            } else {
                elements.changeBoxBtn.style.display = 'none';
            }
        }
    }

    // Функція для видалення товару
    function removeProduct(productName) {
        const index = assembleState.selectedProducts.findIndex(p => p.name === productName);
        if (index >= 0) {
            assembleState.selectedProducts.splice(index, 1);
            
            // Перерендерюємо товари та оновлюємо UI
            const activeFilter = document.querySelector('.filter-btn.active');
            const currentCategory = activeFilter ? activeFilter.getAttribute('data-category') : 'all';
            renderProducts(currentCategory);
            
            updateCapacityInfo();
            updateUI();
            
            // Показуємо сповіщення
            showAlert(`Товар "${productName}" видалено з боксу`, 'info', 2000);
        }
    }

    // Функція для зміни кількості товару в підсумку
    function updateSummaryQuantity(productName, change) {
        const product = assembleState.selectedProducts.find(p => p.name === productName);
        if (!product) return;
        
        const newQuantity = product.quantity + change;
        
        if (newQuantity <= 0) {
            // Видаляємо товар
            removeProduct(productName);
        } else {
            // Перевіряємо місткість при збільшенні
            if (change > 0) {
                const capacity = checkCapacity();
                if (capacity.exceeded >= 0 && capacity.remaining === 0) {
                    showAlert('Коробка заповнена! Зменшіть кількість товарів або змініть коробку', 'danger');
                    return;
                }
            }
            
            // Оновлюємо кількість
            product.quantity = newQuantity;
            
            // Перерендерюємо товари та оновлюємо UI
            const activeFilter = document.querySelector('.filter-btn.active');
            const currentCategory = activeFilter ? activeFilter.getAttribute('data-category') : 'all';
            renderProducts(currentCategory);
            
            updateCapacityInfo();
            updateUI();
        }
    }

    // ========== ЗАВАНТАЖЕННЯ ДАНИХ ==========

    // Завантаження даних
    async function loadData() {
        try {
            console.log('Завантаження даних...');
            
            // Спробуємо завантажити з різних шляхів
            const paths = [
                '/data/product.json',
                '../data/product.json',
                './data/product.json',
                '/aseets/data/product.json'
            ];
            
            let data = null;
            
            for (const path of paths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        data = await response.json();
                        console.log('Дані завантажено з:', path);
                        break;
                    }
                } catch (e) {
                    console.log('Не вдалося завантажити з:', path);
                }
            }
            
            if (!data) {
                console.error('Не вдалося завантажити дані');
                // Створюємо тестові дані
                data = {
                    boxes: [
                        { name: "Маленька коробка", price: 50, image: "/aseets/foto/лого2.png", capacity: 3 },
                        { name: "Середня коробка", price: 70, image: "/aseets/foto/лого2.png", capacity: 5 },
                        { name: "Велика коробка", price: 100, image: "/aseets/foto/лого2.png", capacity: 8 }
                    ],
                    cards: [
                        { name: "Листівка класична", price: 20, image: "/aseets/foto/лого2.png" },
                        { name: "Листівка святкова", price: 25, image: "/aseets/foto/лого2.png" }
                    ],
                    karamel: [],
                    chocolate: [],
                    candies: []
                };
            }
            
            // Обробляємо дані
            assembleState.boxes = data.boxes || [];
            assembleState.cards = data.cards || [];
            
            // Збираємо всі товари
            const allProducts = [];
            for (const category in data) {
                if (category !== 'boxes' && category !== 'cards' && Array.isArray(data[category])) {
                    data[category].forEach(product => {
                        allProducts.push({
                            ...product,
                            category: category
                        });
                    });
                }
            }
            
            assembleState.availableProducts = allProducts;
            console.log('Завантажено:', {
                boxes: assembleState.boxes.length,
                cards: assembleState.cards.length,
                products: allProducts.length
            });
            
            // Рендеримо
            renderBoxes();
            renderProducts();
            renderCards();
            updateCapacityInfo();
            
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
        }
    }

    // ========== РЕНДЕР ФУНКЦІЇ ==========

    // Рендер коробок
    function renderBoxes() {
        if (!elements.boxesList) return;
        
        elements.boxesList.innerHTML = '';
        
        if (assembleState.boxes.length === 0) {
            elements.boxesList.innerHTML = '<li class="product-item">Немає доступних коробок</li>';
            return;
        }
        
        assembleState.boxes.forEach(box => {
            const isSelected = assembleState.selectedBox?.name === box.name;
            const li = document.createElement('li');
            li.className = 'product-item';
            
            li.innerHTML = `
                <div class="product-image">
                    <img src="${box.image}" alt="${box.name}" loading="lazy">
                    ${isSelected ? '<span class="selected-badge">✓</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${box.name}</h3>
                    <p class="product-description">Містить до ${box.capacity} товарів</p>
                    <div class="product-footer">
                        <span class="product-price">${box.price} грн</span>
                    </div>
                    <button class="select-box-btn ${isSelected ? 'selected' : ''}" 
                            data-box-name="${box.name}">
                        ${isSelected ? 'Обрано ✓' : 'Обрати коробку'}
                    </button>
                </div>
            `;
            elements.boxesList.appendChild(li);
        });
        
        // Додаємо обробники подій
        attachBoxHandlers();
    }

    // Обробники для коробок
    function attachBoxHandlers() {
        document.querySelectorAll('.select-box-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const boxName = this.getAttribute('data-box-name');
                console.log('Вибрано коробку:', boxName);
                selectBox(boxName);
            });
        });
    }

    // Рендер товарів
    function renderProducts(category = 'all') {
        if (!elements.productsList) return;
        
        elements.productsList.innerHTML = '';
        const filteredProducts = category === 'all' 
            ? assembleState.availableProducts 
            : assembleState.availableProducts.filter(p => p.category === category);

        if (filteredProducts.length === 0) {
            elements.productsList.innerHTML = '<li class="product-item">Немає товарів у цій категорії</li>';
            return;
        }

        const capacity = checkCapacity();
        const isFull = capacity.remaining === 0;

        filteredProducts.forEach(product => {
            const selectedProduct = assembleState.selectedProducts.find(p => p.name === product.name);
            const isSelected = !!selectedProduct;
            const quantity = selectedProduct ? selectedProduct.quantity : 0;
            
            // Перевіряємо, чи можна додати ще один товар
            const canAddMore = !isFull || isSelected;
            const itemClass = canAddMore ? 'product-item' : 'product-item overcapacity';
            
            const li = document.createElement('li');
            li.className = itemClass;
            
            li.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${isSelected ? '<span class="selected-badge">'+quantity+'</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description ? product.description.substring(0, 50) + '...' : ''}</p>
                    <div class="product-footer">
                        <span class="product-price">${product.price} грн</span>
                    </div>
                    <div class="product-actions assemble">
             <button class="view-details" data-product-name="${product.name}">
        Деталі
    </button>
                        
                        <div class="quantity-controls">
                            <button class="qty-minus" data-product-name="${product.name}" 
                                    ${!isSelected ? 'disabled' : ''}>-</button>
                            <span class="qty-display">${quantity}</span>
                            <button class="qty-plus" data-product-name="${product.name}" 
                                    ${!canAddMore ? 'disabled' : ''}>+</button>
                        </div>
                    </div>
                </div>
            `;
            elements.productsList.appendChild(li);
        });
        
        // Додаємо обробники подій
        attachProductHandlers();
    }
// Функція показу модалки продукту
function showProductModal(product) {
    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');

    if (!modal || !modalBody) return;

    // Виправляємо шляхи до зображень
    const mainImage = product.image.startsWith('http') ? product.image : product.image.startsWith('/') ? product.image : '../' + product.image;
    const gallery = (product.additional_images || []).map(img => img.startsWith('http') ? img : img.startsWith('/') ? img : '../' + img);

    modalBody.innerHTML = `
        <div class="product-details detalies">
            <div class="product-details__image">
                <img src="${mainImage}" alt="${product.name}" class="main-modal-image">
            </div>
            <div class="product-details__info">
                <h2 class="product-details__title">${product.name}</h2>
                <p class="product-details__price">${product.price} грн</p>
                <p><strong>Опис:</strong> ${product.description || '—'}</p>
                <p><strong>Інгредієнти:</strong> ${product.ingredients || '—'}</p>
                <p><strong>Вага:</strong> ${product.weight || '—'}</p>
                <p><strong>Термін зберігання:</strong> ${product.storage || '—'}</p>
                <button class="btn add-from-modal">Додати в бокс</button>
            </div>
        </div>
        ${gallery.length ? `
        <div class="product-gallery">
            ${gallery.map(img => `<img src="${img}" class="thumb" width="100">`).join('')}
        </div>` : ''}
    `;

    // Кнопка "Додати в бокс"
    modalBody.querySelector('.add-from-modal').addEventListener('click', () => {
        updateProductQuantity(product.name, 1); // додаємо в бокс
        modal.style.display = 'none';
    });

    // Галерея
    let currentImages = gallery.length ? [mainImage, ...gallery] : [mainImage];
    let currentIndex = 0;

    function openModalImage(index) {
        modalBody.querySelector('.main-modal-image').src = currentImages[index];
        currentIndex = index;
    }

    modalBody.querySelectorAll('.thumb').forEach((thumb, idx) => {
        thumb.addEventListener('click', () => openModalImage(idx + 1));
    });

    modal.style.display = 'flex';
}

// Закриття модалки
document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('product-modal').style.display = 'none';
});

// =================== КНОПКИ ДЕТАЛЕЙ У БОКСІ ===================
function attachProductHandlers() {
    // Кнопки деталей
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const productName = btn.getAttribute('data-product-name');
            const product = assembleState.availableProducts.find(p => p.name === productName);
            if (product) showProductModal(product);
        });
    });

    // Кнопки кількості
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            updateProductQuantity(this.getAttribute('data-product-name'), -1);
        });
    });

    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            updateProductQuantity(this.getAttribute('data-product-name'), 1);
        });
    });
}

    // Рендер листівок
    function renderCards() {
        if (!elements.cardsList) return;
        
        elements.cardsList.innerHTML = '';
        
        // Додаємо опцію "Без листівки"
        const allCards = [
            { name: 'Без листівки', price: 0, image: '/foto/logo2.png' },
            ...assembleState.cards
        ];
        
        allCards.forEach(card => {
            const isSelected = assembleState.selectedCard?.name === card.name;
            const li = document.createElement('li');
            li.className = 'product-item';
            
            li.innerHTML = `
                <div class="product-image">
                    <img src="${card.image}" alt="${card.name}" loading="lazy">
                    ${isSelected ? '<span class="selected-badge">✓</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${card.name}</h3>
                    <div class="product-footer">
                        <span class="product-price">${card.price} грн</span>
                    </div>
                    <button class="select-card-btn ${isSelected ? 'selected' : ''}" 
                            data-card-name="${card.name}">
                        ${isSelected ? 'Обрано ✓' : 'Обрати'}
                    </button>
                </div>
            `;
            elements.cardsList.appendChild(li);
        });
        
        // Додаємо обробники подій
        attachCardHandlers();
    }

    // Обробники для листівок
    function attachCardHandlers() {
        document.querySelectorAll('.select-card-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const cardName = this.getAttribute('data-card-name');
                selectCard(cardName);
            });
        });
    }

    // Рендер підсумку
    function renderSummary() {
        if (!elements.selectedItems) return;
        
        elements.selectedItems.innerHTML = '';
        
        if (assembleState.selectedProducts.length === 0 && !assembleState.selectedBox) {
            elements.selectedItems.innerHTML = '<div class="empty-summary">Бокс порожній</div>';
            return;
        }
        
        // Додаємо коробку
        if (assembleState.selectedBox) {
            const boxItem = document.createElement('div');
            boxItem.className = 'summary-item';
            boxItem.innerHTML = `
                <div class="item-preview">
                    <span class="item-name">${assembleState.selectedBox.name}</span>
                </div>
                <div class="item-actions">
                    <span class="item-price">${assembleState.selectedBox.price} грн</span>
                </div>
            `;
            elements.selectedItems.appendChild(boxItem);
        }
        
        // Додаємо товари
        assembleState.selectedProducts.forEach(item => {
            const productItem = document.createElement('div');
            productItem.className = 'summary-item';
            productItem.innerHTML = `
                <div class="item-preview">
                    <span class="item-name">${item.name}</span>
                </div>
                <div class="item-actions">
                    <div class="item-quantity">
                        <button class="quantity-btn minus" data-product-name="${item.name}">-</button>
                        <span>${item.quantity} шт</span>
                        <button class="quantity-btn plus" data-product-name="${item.name}">+</button>
                    </div>
                    <span class="item-price">${item.price * item.quantity} грн</span>
                    <button class="remove-item-btn" data-product-name="${item.name}" title="Видалити">×</button>
                </div>
            `;
            elements.selectedItems.appendChild(productItem);
        });
        
        // Додаємо листівку
        if (assembleState.selectedCard) {
            const cardItem = document.createElement('div');
            cardItem.className = 'summary-item';
            cardItem.innerHTML = `
                <div class="item-preview">
                    <span class="item-name">${assembleState.selectedCard.name}</span>
                </div>
                <div class="item-actions">
                    <span class="item-price">${assembleState.selectedCard.price} грн</span>
                    <button class="remove-item-btn" data-card-name="${assembleState.selectedCard.name}" title="Видалити">×</button>
                </div>
            `;
            elements.selectedItems.appendChild(cardItem);
        }
        
        // Додаємо обробники подій для підсумку
        attachSummaryHandlers();
    }

    // Обробники для підсумку
    function attachSummaryHandlers() {
        // Кнопки зміни кількості
        document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const productName = this.getAttribute('data-product-name');
                updateSummaryQuantity(productName, -1);
            });
        });
        
        document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const productName = this.getAttribute('data-product-name');
                updateSummaryQuantity(productName, 1);
            });
        });
        
        // Кнопки видалення товарів
        document.querySelectorAll('.remove-item-btn[data-product-name]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const productName = this.getAttribute('data-product-name');
                
                // Показуємо підтвердження
                if (confirm(`Видалити "${productName}" з боксу?`)) {
                    removeProduct(productName);
                }
            });
        });
        
        // Кнопки видалення листівки
        document.querySelectorAll('.remove-item-btn[data-card-name]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const cardName = this.getAttribute('data-card-name');
                selectCard('Без листівки');
            });
        });
    }

    // ========== ОСНОВНІ ФУНКЦІЇ ==========

    // Вибір коробки
    function selectBox(boxName) {
        const box = assembleState.boxes.find(b => b.name === boxName);
        if (!box) return console.warn("❌ Коробка не знайдена:", boxName); ;

        assembleState.selectedBox = box;
        console.log("✅ assembleState.selectedBox встановлено:", assembleState.selectedBox);
        // Оновлюємо UI
        renderBoxes();
        
        // Оновлюємо лічильник
        if (elements.boxCounter) {
            elements.boxCounter.innerHTML = `
                <strong>Обрана коробка:</strong> ${box.name} (до ${box.capacity} товарів) - ${box.price} грн
            `;
        }
        
        // Переходимо до кроку 2 (листівка)
        setTimeout(() => {
            goToStep(2);
        }, 100);
        
        updateCapacityInfo();
        updateUI();
    }

    // Вибір листівки
    function selectCard(cardName) {
        console.log('Вибираємо листівку:', cardName);
        
        if (cardName === 'Без листівки') {
            assembleState.selectedCard = null;
        } else {
            const card = assembleState.cards.find(c => c.name === cardName);
            if (!card) {
                console.error('Листівка не знайдена:', cardName);
                return;
            }
            assembleState.selectedCard = card;
        }
        
        renderCards();
        updateUI();
        
        // Після вибору листівки показуємо кнопку зміни у товарах
        if (elements.changeCardBtn && assembleState.currentStep === 3) {
            elements.changeCardBtn.style.display = 'inline-block';
        }
    }

    // Налаштування кнопки пропуску листівки
    function setupSkipCardButton() {
        if (!elements.skipCardBtn) return;
        
        elements.skipCardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Автоматично обираємо "Без листівки"
            selectCard('Без листівки');
            
            // Переходимо до наступного кроку (товари)
            setTimeout(() => {
                goToStep(3);
                showAlert('Листівку пропущено. Можете повернутися назад та обрати.', 'info', 2000);
            }, 300);
        });
    }

    // Налаштування кнопки зміни листівки
    function setupChangeCardButton() {
        if (!elements.changeCardBtn) return;
        
        elements.changeCardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Повертаємося до вибору листівки
            goToStep(2);
            
            // Показуємо підказку
            showAlert('Оберіть листівку або пропустіть цей крок', 'info', 2000);
        });
    }

    // Налаштування навігації
    function setupNavigation() {
        if (elements.nextStepBtn) {
            elements.nextStepBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (assembleState.currentStep < 3) {
                    goToStep(assembleState.currentStep + 1);
                    
                    // Якщо переходимо до товарів (крок 3) - оновлюємо кнопки
                    if (assembleState.currentStep === 3) {
                        // Показуємо кнопку зміни коробки, якщо коробка обрана
                        if (elements.changeBoxBtn && assembleState.selectedBox) {
                            elements.changeBoxBtn.style.display = 'inline-block';
                        }
                        // Показуємо кнопку зміни листівки, якщо листівка обрана
                        if (elements.changeCardBtn && assembleState.selectedCard) {
                            elements.changeCardBtn.style.display = 'inline-block';
                        }
                    }
                } else {
                    // Крок 3 завершений - можна додавати в кошик
                    document.querySelector('.box-summary').scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    showAlert('Вітаємо! Бокс готовий. Перевірте підсумок та додайте в кошик.', 'success', 3000);
                }
            });
        }
        
        if (elements.prevStepBtn) {
            elements.prevStepBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (assembleState.currentStep > 1) {
                    goToStep(assembleState.currentStep - 1);
                }
            });
        }
    }

    // Оновлення кількості товару
    function updateProductQuantity(productName, change) {
        const product = assembleState.availableProducts.find(p => p.name === productName);
        if (!product) return;

        const existingIndex = assembleState.selectedProducts.findIndex(p => p.name === productName);
        const capacity = checkCapacity();
        
        if (change > 0) {
            // Додавання товару
            if (capacity.exceeded > 0) {
                showAlert('Коробка заповнена! Змініть коробку або видаліть інші товари', 'danger');
                return;
            }
            
            if (capacity.remaining === 0) {
                showAlert('Коробка заповнена! Змініть коробку на більшу', 'warning');
                return;
            }
        }
        
        if (existingIndex >= 0) {
            const newQty = assembleState.selectedProducts[existingIndex].quantity + change;
            
            if (newQty <= 0) {
                // Видаляємо товар
                assembleState.selectedProducts.splice(existingIndex, 1);
            } else {
                // Оновлюємо кількість
                assembleState.selectedProducts[existingIndex].quantity = newQty;
            }
        } else if (change > 0) {
            // Додаємо новий товар
            assembleState.selectedProducts.push({
                ...product,
                quantity: 1
            });
        }
        
        // Перерендерюємо товари
        const activeFilter = document.querySelector('.filter-btn.active');
        const currentCategory = activeFilter ? activeFilter.getAttribute('data-category') : 'all';
        renderProducts(currentCategory);
        
        updateCapacityInfo();
        updateUI();
    }

    // Оновлення UI
    function updateUI() {
        renderSummary();
        calculateTotal();
        updateProgress();
    }

    // Розрахунок загальної ціни
    function calculateTotal() {
        if (!elements.totalPrice) return;
        
        let total = 0;
        
        if (assembleState.selectedBox) {
            total += assembleState.selectedBox.price;
        }
        
        assembleState.selectedProducts.forEach(item => {
            total += item.price * item.quantity;
        });
        
        if (assembleState.selectedCard) {
            total += assembleState.selectedCard.price;
        }
        
        elements.totalPrice.textContent = total;
    }

    // Показ деталей товару
    function showProductDetails(productName) {
    const product = assembleState.availableProducts.find(p => p.name === productName);
    if (!product) return;

    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');

    const gallery = product.additional_images || [];

    modalBody.innerHTML = `
        <div class="product-details">
            <div class="product-details__image">
                <img src="${product.image}" alt="${product.name}">
            </div>

            <div class="product-details__info">
                <h2 class="product-details__title">${product.name}</h2>

                <p class="product-details__price">${product.price} грн</p>

                <p><strong>Опис:</strong> ${product.description || '—'}</p>
                <p><strong>Інгредієнти:</strong> ${product.ingredients || '—'}</p>
                <p><strong>Вага:</strong> ${product.weight || '—'}</p>
                <p><strong>Термін зберігання:</strong> ${product.storage || '—'}</p>

                <button class="btn add-from-modal">Додати в бокс</button>
            </div>
        </div>

        ${gallery.length ? `
        <div class="product-gallery">
            ${gallery.map(img => `
                <img src="${img}" class="gallery-thumb">
            `).join('')}
        </div>` : ''}
    `;

    // кнопка "додати в бокс"
    modalBody.querySelector('.add-from-modal').addEventListener('click', () => {
        updateProductQuantity(product.name, 1);
        modal.style.display = 'none';
    });

    modal.style.display = 'flex';
}

    // Навігація по кроках
    function goToStep(step) {
        assembleState.currentStep = step;
        
        // Ховаємо всі секції
        Object.values(elements.sections).forEach(section => {
            if (section) section.style.display = 'none';
        });
        
        // НОВИЙ ПОРЯДОК КРОКІВ:
        // 1 = Коробка, 2 = Листівка, 3 = Товари
        if (step === 1 && elements.sections.box) {
            elements.sections.box.style.display = 'block';
            if (elements.prevStepBtn) elements.prevStepBtn.style.display = 'none';
            if (elements.nextStepBtn) {
                elements.nextStepBtn.disabled = !assembleState.selectedBox;
                elements.nextStepBtn.textContent = 'Далі →';
            }
        } else if (step === 2 && elements.sections.card) {
            elements.sections.card.style.display = 'block';
            if (elements.prevStepBtn) elements.prevStepBtn.style.display = 'inline-block';
            if (elements.nextStepBtn) {
                elements.nextStepBtn.disabled = false; // Завжди активна
                elements.nextStepBtn.textContent = 'Далі до товарів →';
            }
        } else if (step === 3 && elements.sections.products) {
            elements.sections.products.style.display = 'block';
            if (elements.prevStepBtn) elements.prevStepBtn.style.display = 'inline-block';
            if (elements.nextStepBtn) {
                elements.nextStepBtn.disabled = false;
                elements.nextStepBtn.textContent = 'Завершити ✅';
            }
        }
        
        updateProgress();
    }

    // Оновлення прогресу
    function updateProgress() {
        if (!elements.progressSteps) return;
        
        elements.progressSteps.forEach((step, index) => {
            if (index + 1 < assembleState.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index + 1 === assembleState.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    // Додавання боксу в кошик
    function addBoxToCart() {
    if (!assembleState.selectedBox) {
        showAlert('Будь ласка, оберіть коробку', 'warning');
        return;
    }

    const capacity = checkCapacity();
    if (!capacity.isValid) {
        showAlert('Кількість товарів перевищує місткість коробки!', 'danger');
        return;
    }

    if (assembleState.selectedProducts.length === 0) {
        showAlert('Додайте хоча б один товар до боксу', 'warning');
        return;
    }

 
    // ✅ РОЗШИРЕНА ІНФОРМАЦІЯ ПРО БОКС
    const boxData = {
        type: "custom_box",
        name: `🎁 ПОДАРУНКОВИЙ БОКС: ${assembleState.selectedBox.name}`,
        quantity: 1,
        price: Number(calculateTotalPrice()) || 0,
        image: assembleState.selectedBox.image || '/foto/logo2.png',
        
        // ✅ ДЕТАЛЬНА ІНФОРМАЦІЯ (для тебе!)
        box_details: {
            box_name: assembleState.selectedBox.name,
            box_capacity: assembleState.selectedBox.capacity,
            box_price: assembleState.selectedBox.price,
            box_image: assembleState.selectedBox.image || '/foto/logo2.png',
            
            // ВСІ товари з деталями
            products: assembleState.selectedProducts.map(p => ({
                product_id: p.id || '', // якщо є ID
                product_name: p.name,
                product_price: Number(p.price) || 0,
                product_quantity: Number(p.quantity) || 1,
                product_description: p.description || '',
                product_image: p.image || '/foto/logo2.png',
                product_category: p.category || ''
            })),
            
            // Листівка з деталями
            card: assembleState.selectedCard ? {
                card_name: assembleState.selectedCard.name,
                card_price: Number(assembleState.selectedCard.price) || 0,
                card_image: assembleState.selectedCard.image || '/foto/logo2.png'
            } : null,
            
            // Загальна інформація
            total_items: assembleState.selectedProducts.reduce((sum, item) => sum + (item.quantity || 1), 0),
            created_at: new Date().toISOString(),
            box_notes: '' // можна додати нотатки
        },
        
        // ✅ КОРОТКА ІНФОРМАЦІЯ (для відображення в кошику)
        box: {
            name: assembleState.selectedBox.name,
            capacity: assembleState.selectedBox.capacity,
            price: assembleState.selectedBox.price
        },
        
        products: assembleState.selectedProducts.map(p => ({
            name: p.name,
            price: Number(p.price) || 0,
            quantity: Number(p.quantity) || 1
        })),
        
        card: assembleState.selectedCard
            ? {
                name: assembleState.selectedCard.name,
                price: Number(assembleState.selectedCard.price) || 0
            }
            : null
    };

     // ✅ ГАРАНТОВАНИЙ КОШИК
    if (!Array.isArray(window.cart)) {
        window.cart = JSON.parse(localStorage.getItem("cart")) || [];
    }

    window.cart.push(boxData);

    // ✅ БЕЗПЕЧНЕ ЗБЕРЕЖЕННЯ
    if (typeof window.saveCart === "function") {
        window.saveCart();
    } else {
        localStorage.setItem("cart", JSON.stringify(window.cart));
    }

    // ✅ ОНОВЛЮЄМО UI КОШИКА
    if (typeof window.updateCart === "function") {
        window.updateCart();
    }

    showAlert("🎁 Бокс додано в кошик!", "success", 3000);

    resetBuilder();
}


function createBoxDescription() {
    let desc = `Коробка: ${assembleState.selectedBox.name}\n`;
    desc += `Товари:\n`;
    
    assembleState.selectedProducts.forEach(item => {
        desc += `- ${item.name} (${item.quantity} шт)\n`;
    });
    
    if (assembleState.selectedCard) {
        desc += `\nЛистівка: ${assembleState.selectedCard.name}`;
    }
    
    return desc;
}

function calculateTotalPrice() {
    let total = assembleState.selectedBox.price || 0;
    
    assembleState.selectedProducts.forEach(item => {
        total += (item.price || 0) * (item.quantity || 1);
    });
    
    if (assembleState.selectedCard) {
        total += assembleState.selectedCard.price || 0;
    }
    
    return total;
}

// ✅ Функція для створення назви з усіма деталями
function generateBoxName() {
    let name = `🎁 ПОДАРУНКОВИЙ БОКС: ${assembleState.selectedBox.name} | `;
    
    // Додаємо всі товари
    assembleState.selectedProducts.forEach(item => {
        name += `${item.name} (${item.quantity}шт) `;
    });
    
    // Додаємо листівку
    if (assembleState.selectedCard) {
        name += `| Листівка: ${assembleState.selectedCard.name} `;
    }
    
    // Додаємо загальну ціну
    name += `| ${totalPrice}грн`;
    
    // Обмежуємо довжину (на всяк випадок)
    if (name.length > 200) {
        name = name.substring(0, 197) + '...';
    }
    
    return name;
}
// ✅ Допоміжна функція для створення опису
function generateBoxDescription() {
    let description = `Коробка: ${assembleState.selectedBox.name} (${assembleState.selectedBox.capacity} місць)\n`;
    description += `Вміст:\n`;
    
    assembleState.selectedProducts.forEach(item => {
        description += `• ${item.name} - ${item.quantity} шт\n`;
    });
    
    if (assembleState.selectedCard) {
        description += `\Листівка: ${assembleState.selectedCard.name}`;
    }
    
    return description;
}
// Функція для оновлення відображення кошика
function updateCartDisplay() {
    // Оновлюємо лічильник
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    // Оновлюємо всі лічильники на сторінці
    document.querySelectorAll('.cart-count, .cart-count-modal').forEach(el => {
        el.textContent = totalItems;
    });
    
    // Якщо кошик відкритий - оновлюємо його
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && cartModal.style.display === 'flex') {
        if (typeof updateCart === 'function') {
            updateCart();
        }
    }
}

    // Скидання конструктора
    function resetBuilder() {
        assembleState.selectedBox = null;
        assembleState.selectedCard = null;
        assembleState.selectedProducts = [];
        assembleState.currentStep = 1;
        
        if (elements.boxCounter) elements.boxCounter.textContent = 'Коробка не обрана';
        if (elements.usedSlots) elements.usedSlots.textContent = '0';
        if (elements.totalSlots) elements.totalSlots.textContent = '0';
        if (elements.totalPrice) elements.totalPrice.textContent = '0';
        if (elements.selectedItems) elements.selectedItems.innerHTML = '';
        if (elements.addToCartBtn) elements.addToCartBtn.disabled = true;
        if (elements.nextStepBtn) elements.nextStepBtn.disabled = true;
        
        goToStep(1);
        renderBoxes();
        renderProducts();
        renderCards();
        updateCapacityInfo();
    }

    // Ініціалізація фільтрів
    function initFilters() {
        if (!elements.filterBtns || elements.filterBtns.length === 0) return;
        
        elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const category = this.getAttribute('data-category');
                
                elements.filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                renderProducts(category);
            });
        });
    }

    // ========== ІНІЦІАЛІЗАЦІЯ ==========

    function init() {
        console.log('=== ІНІЦІАЛІЗАЦІЯ КОНСТРУКТОРА БОКСІВ ===');
        
        loadData();
        initFilters();
        
        // Кнопка зміни коробки
        if (elements.changeBoxBtn) {
            elements.changeBoxBtn.addEventListener('click', function(e) {
                e.preventDefault();
                goToStep(1);
            });
        }
        
        // Обробники навігації
        if (elements.nextStepBtn) {
            elements.nextStepBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (assembleState.currentStep < 3) {
                    goToStep(assembleState.currentStep + 1);
                }
            });
        }
        
        if (elements.prevStepBtn) {
            elements.prevStepBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (assembleState.currentStep > 1) {
                    goToStep(assembleState.currentStep - 1);
                }
            });
        }
        
        // Додавання в кошик
        if (elements.addToCartBtn) {
            elements.addToCartBtn.addEventListener('click', function(e) {
                e.preventDefault();
                addBoxToCart();
            });
        }
        
        // Початковий стан
        goToStep(1);
        updateCapacityInfo();
    }

    // Запуск
    init();
});
function renderCustomBoxForCheckout(item, index) {
    if (!item.box_details) {
        // Старий формат (без деталей)
        return `
            <div class="order-item">
                <div class="item-info">
                    <strong>${item.name}</strong>
                </div>
                <div class="item-price">${item.price} Kč</div>
            </div>
        `;
    }
    
    // Новий формат (з деталями)
    const box = item.box_details;
    
    return `
        <div class="order-box-item" style="margin-bottom: 25px; border-left: 4px solid #C49A6C; padding-left: 15px;">
            <!-- Заголовок боксу -->
            <div class="order-item">
                <div class="item-info">
                    <strong>${item.name}</strong>
                    <div style="font-size: 14px; color: #666; margin-top: 5px;">
                        📦 ${box.box_name} | ${box.total_items} товарів
                    </div>
                </div>
                <div class="item-price">${item.price} Kč</div>
            </div>
            
            <!-- ДЕТАЛЬНИЙ ВМІСТ -->
            <div class="box-contents" style="margin: 15px 0; padding: 15px; background: #FFF8F0; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #5D4037;">📦 Вміст боксу:</h4>
                
                <!-- Коробка -->
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>${box.box_name} (до ${box.box_capacity} товарів)</span>
                    <span>${box.box_price} Kč</span>
                </div>
                
                <!-- Товари -->
                ${box.products.map(product => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <div>
                            <strong>${product.product_name}</strong>
                            <div style="font-size: 12px; color: #888;">
                                ${product.product_description ? product.product_description.substring(0, 50) + '...' : ''}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            ${product.product_quantity} × ${product.product_price} Kč<br>
                            <strong>${product.product_quantity * product.product_price} Kč</strong>
                        </div>
                    </div>
                `).join('')}
                
                <!-- Листівка -->
                ${box.card ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <span>🎴 ${box.card.card_name}</span>
                        <span>${box.card.card_price} Kč</span>
                    </div>
                ` : ''}
                
                <!-- Підсумок -->
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #C49A6C; margin-top: 10px; font-weight: bold;">
                    <span>Вартість боксу:</span>
                    <span>${item.price} Kč</span>
                </div>
            </div>
        </div>
    `;
}
// У файлі checkout.js онови функцію loadOrderSummary():
function loadOrderSummary() {
    const orderItemsList = document.getElementById('order-items-list');
    const orderTotal = document.getElementById('order-total');
    
    if (!orderItemsList) return;
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    let total = 0;
    
    orderItemsList.innerHTML = '';
    
    if (cart.length === 0) {
        orderItemsList.innerHTML = '<p>Кошик порожній</p>';
        return;
    }
    
    cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        
        if (item.type === 'custom_box') {
            // БОКС з детальним відображенням
            itemElement.innerHTML = renderCustomBoxForCheckout(item, index);
            total += item.price * (item.quantity || 1);
        } else if (item.isGift) {
            // ПОДАРУНОК
            itemElement.innerHTML = `
                <div class="order-item" style="background: #F0FFF4; padding: 15px; border-radius: 8px;">
                    <div class="item-info">
                        <strong>${item.name}</strong>
                        <div style="font-size: 14px; color: #666;">
                            🎁 Безкоштовний подарунок (вартість: ${item.value || 0} Kč)
                        </div>
                    </div>
                    <div class="item-price" style="color: #4CAF50; font-weight: bold;">
                        БЕЗКОШТОВНО
                    </div>
                </div>
            `;
            // Подарунки не додаємо до загальної суми
        } else {
            // ЗВИЧАЙНИЙ ТОВАР
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            total += itemTotal;
            
            itemElement.innerHTML = `
                <div class="order-item">
                    <div class="item-info">
                        <strong>${item.name}</strong>
                        <div style="font-size: 14px; color: #666;">
                            ${item.quantity || 1} × ${item.price || 0} Kč
                        </div>
                    </div>
                    <div class="item-price">
                        ${itemTotal} Kč
                    </div>
                </div>
            `;
        }
        
        orderItemsList.appendChild(itemElement);
    });
    
    // Загальна сума
    orderTotal.textContent = `${total.toFixed(2)} Kč`;
    
    // ✅ ЗБЕРІГАЄМО ДАНІ ДЛЯ ВІДПРАВКИ
    saveOrderForSubmission(cart, total);
}
function saveOrderForSubmission(cart, total) {
    const orderDetails = {
        items: cart.map(item => {
            if (item.type === 'custom_box') {
                return {
                    type: 'custom_box',
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity || 1,
                    details: item.box_details || {},
                    total: item.price * (item.quantity || 1)
                };
            } else if (item.isGift) {
                return {
                    type: 'gift',
                    name: item.name,
                    value: item.value || 0,
                    quantity: item.quantity || 1
                };
            } else {
                return {
                    type: 'regular',
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity || 1,
                    total: (item.price || 0) * (item.quantity || 1)
                };
            }
        }),
        
        summary: {
            subtotal: total,
            delivery: 0, // буде заповнено пізніше
            total: total,
            currency: 'Kč',
            timestamp: new Date().toISOString(),
            order_id: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        }
    };
    
    // Зберігаємо для подальшої відправки
    localStorage.setItem('current_order', JSON.stringify(orderDetails));
    return orderDetails;
}
// У формі замовлення додай:
document.getElementById('order-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Збираємо дані форми
    const customerData = {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        country: document.getElementById('delivery-country').value,
        address: document.getElementById('customer-address').value,
        notes: document.getElementById('order-notes').value
    };
    
    // Збираємо замовлення
    const orderData = JSON.parse(localStorage.getItem('current_order')) || {};
    
    // Формуємо повне замовлення
    const fullOrder = {
        customer: customerData,
        order: orderData,
        date: new Date().toISOString()
    };
    
    // ✅ ВІДПРАВКА НА ТВІЙ EMAIL/TELEGRAM
    sendOrderToYou(fullOrder);
});

// Функція для відправки
function sendOrderToYou(orderData) {
    // Формуємо детальне повідомлення
    let message = `📦 НОВЕ ЗАМОВЛЕННЯ!\n\n`;
    
    message += `👤 Клієнт: ${orderData.customer.name}\n`;
    message += `📞 Телефон: ${orderData.customer.phone}\n`;
    message += `📧 Email: ${orderData.customer.email}\n`;
    message += `📍 Країна: ${orderData.customer.country}\n`;
    message += `🏠 Адреса: ${orderData.customer.address}\n\n`;
    
    message += `🛒 ЗАМОВЛЕННЯ:\n`;
    
    orderData.order.items.forEach((item, index) => {
        if (item.type === 'custom_box') {
            message += `\n🎁 БОКС: ${item.name}\n`;
            message += `   Ціна: ${item.price} Kč\n`;
            
            if (item.details) {
                message += `   Коробка: ${item.details.box_name}\n`;
                message += `   Товари:\n`;
                item.details.products.forEach(prod => {
                    message += `     - ${prod.product_name} (${prod.product_quantity} шт) - ${prod.product_price} Kč\n`;
                });
                if (item.details.card) {
                    message += `   Листівка: ${item.details.card.card_name}\n`;
                }
            }
        } else if (item.type === 'gift') {
            message += `\n🎁 ПОДАРУНОК: ${item.name}\n`;
        } else {
            message += `\n${item.name} - ${item.quantity} × ${item.price} Kč = ${item.total} Kč\n`;
        }
    });
    
    message += `\n💰 ЗАГАЛЬНА СУМА: ${orderData.order.summary.total} Kč\n`;
    message += `📝 Нотатки: ${orderData.customer.notes || 'немає'}\n`;
    message += `🆔 ID замовлення: ${orderData.order.summary.order_id}`;
    
    // ВАРІАНТ 1: Відправка на Email (через Formspree, EmailJS або PHP)
    // ВАРІАНТ 2: Відправка в Telegram (через бота)
    // ВАРІАНТ 3: Збереження в localStorage для ручного експорту
    
    console.log('📤 Готове замовлення для відправки:');
    console.log(message);
    
    // ТИМЧАСОВО: збережемо в localStorage для перегляду
    localStorage.setItem('last_order_message', message);
    
    alert(`✅ Замовлення оформлено!\n\nID: ${orderData.order.summary.order_id}\n\nІнформацію можна переглянути в консолі (F12 → Console)`);
    
    // Очистити кошик
    localStorage.removeItem('cart');
    localStorage.removeItem('current_order');
    
    // Перенаправити на сторінку подяки
    window.location.href = '/pages/thank-you.html';
}
document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('product-modal').style.display = 'none';
});


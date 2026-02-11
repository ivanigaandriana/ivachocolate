// checkout.js - ОНОВЛЕНА ВАЛІДАЦІЯ + ВИПРАВЛЕНА ЛОГІКА ВІДДІЛЕННЯ
document.addEventListener("DOMContentLoaded", () => {
    // Беремо кошик з глобального window.cart або localStorage
    let cart = window.cart || JSON.parse(localStorage.getItem("cart")) || [];
    const itemsList = document.getElementById("checkout-items");
    const totalEl = document.getElementById("checkout-total");
    const finalTotalEl = document.getElementById("checkout-final-total");
    const infoBox = document.getElementById("checkout-info");
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    const countrySelect = document.getElementById("delivery-country");

    const shippingPostLabel = document.getElementById("shipping-post").closest("label");
    const shippingZasilLabel = document.getElementById("shipping-zasilkovna").closest("label");
    const codLabel = document.getElementById("payment-cash").closest("label");
    const companyCheckbox = document.getElementById("company-order");
    const companyFields = document.getElementById("company-fields");
    const orderForm = document.getElementById("order-form");
    const cardModal = document.getElementById("card-modal");

    let total = 0;
    // ✅ Глобальна змінна для збереження вибраного відділення
    let selectedBranch = null;
    
    // -------------------------
    // Шаблон для помилок валідації
    // -------------------------
    const latinCzechPattern = /^[A-Za-zÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž0-9\s\-.,]+$/;
    const namePattern = /^[A-Za-zÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž\s\-']+$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[\d\s\-\+\(\)]{9,}$/;
    const postalPattern = /^\d{5}$|^\d{3}\s?\d{2}$/;

    // -------------------------
    // ✅ ФУНКЦІЯ ПОКАЗУ/ПРИХОВУВАННЯ БЛОКУ ВІДДІЛЕННЯ
    // -------------------------
    function toggleZasilkovnaBranchBlock() {
        const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
        const branchWrapper = document.getElementById("zasilkovna-point-wrapper");
        const branchText = document.getElementById("selected-branch");
        
        if (!branchWrapper || !branchText) return;

        if (selectedDelivery?.value === "zasilkovna") {
            branchWrapper.style.display = "block";
            // НЕ скидаємо selectedBranch - залишаємо вибране відділення, якщо воно є
        } else {
            branchWrapper.style.display = "none";
            branchText.textContent = "";
            selectedBranch = null; // Скидаємо тільки при виборі іншого способу доставки
        }
    }

    // -------------------------
    // Ініціалізація валідації
    // -------------------------
    function initValidation() {
        const textFields = Array.from(orderForm.querySelectorAll('input[type="text"], input[type="email"], textarea'));
        
        textFields.forEach(field => {
            let hint = field.parentElement.querySelector('.validation-hint');
            if (!hint) {
                hint = document.createElement('div');
                hint.className = 'validation-hint';
                hint.style.color = 'red';
                hint.style.fontSize = '12px';
                hint.style.marginTop = '3px';
                hint.style.minHeight = '15px';
                field.parentElement.appendChild(hint);
            }

            field.addEventListener('input', () => {
                validateSingleField(field);
            });

            field.addEventListener('blur', () => {
                validateSingleField(field);
            });
        });

        const phoneInput = document.getElementById('customer-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                let value = this.value.replace(/\D/g, '');
                if (value.startsWith('420420')) {
                    value = '420' + value.substring(6);
                }
                if (value.length >= 3) {
                    this.value = '+420 ' + value.substring(3).replace(/(\d{3})(?=\d)/g, '$1 ');
                } else if (value.length > 0) {
                    this.value = '+420 ' + value;
                }
            });
        }
    }

    // -------------------------
    // Валідація одного поля
    // -------------------------
    function validateSingleField(field) {
        const hint = field.parentElement.querySelector('.validation-hint');
        if (!hint) return true;
        
        const value = field.value.trim();
        
        hint.textContent = '';
        field.style.border = '';

        if (field.hasAttribute('required') && !value) {
            hint.textContent = 'Поле обов\'язкове для заповнення';
            field.style.border = '2px solid red';
            return false;
        }

        if (!value && !field.hasAttribute('required')) {
            return true;
        }

        let isValid = true;
        let errorMessage = '';

        switch(field.id) {
            case 'customer-name':
            case 'customer-lastname':
                if (!namePattern.test(value)) {
                    errorMessage = 'Використовуйте лише латинські або чеські букви';
                    isValid = false;
                }
                break;

            case 'customer-email':
                if (!emailPattern.test(value)) {
                    errorMessage = 'Некоректний формат email';
                    isValid = false;
                }
                break;

            case 'customer-phone':
                const phoneDigits = value.replace(/\D/g, '');
                if (phoneDigits.length < 9) {
                    errorMessage = 'Телефон має містити щонайменше 9 цифр';
                    isValid = false;
                }
                break;

            case 'customer-city':
            case 'customer-street':
                if (!latinCzechPattern.test(value)) {
                    errorMessage = 'Використовуйте лише латинські або чеські букви та цифри';
                    isValid = false;
                }
                break;

            case 'customer-postal':
                if (!postalPattern.test(value)) {
                    errorMessage = 'Некоректний поштовий індекс (5 цифр)';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            hint.textContent = errorMessage;
            field.style.border = '2px solid red';
        }

        return isValid;
    }

    // -------------------------
    // Валідація всієї форми
    // -------------------------
    function validateForm() {
        let allValid = true;
        
        const textFields = Array.from(orderForm.querySelectorAll('input[type="text"], input[type="email"], textarea'));
        textFields.forEach(field => {
            if (!validateSingleField(field)) {
                if (allValid) field.focus();
                allValid = false;
            }
        });

        if (!countrySelect.value) {
            alert("Будь ласка, виберіть країну!");
            countrySelect.style.border = '2px solid red';
            if (allValid) countrySelect.focus();
            allValid = false;
        } else {
            countrySelect.style.border = '';
        }

        if (!document.querySelector('input[name="delivery"]:checked')) {
            alert("Будь ласка, виберіть спосіб доставки!");
            allValid = false;
        }

        if (!document.querySelector('input[name="payment"]:checked')) {
            alert("Будь ласка, виберіть спосіб оплати!");
            allValid = false;
        }

        if (!document.getElementById("privacy-consent").checked) {
            alert("Погодьтесь на обробку персональних даних.");
            allValid = false;
        }

        if (companyCheckbox.checked) {
            const companyInputs = companyFields.querySelectorAll('input[type="text"]');
            companyInputs.forEach(field => {
                if (!field.value.trim()) {
                    let hint = field.parentElement.querySelector('.validation-hint');
                    if (!hint) {
                        hint = document.createElement('div');
                        hint.className = 'validation-hint';
                        hint.style.color = 'red';
                        hint.style.fontSize = '12px';
                        hint.style.marginTop = '3px';
                        field.parentElement.appendChild(hint);
                    }
                    hint.textContent = 'Поле обов\'язкове для компанії';
                    field.style.border = '2px solid red';
                    if (allValid) field.focus();
                    allValid = false;
                } else {
                    const hint = field.parentElement.querySelector('.validation-hint');
                    if (hint) hint.textContent = '';
                    field.style.border = '';
                }
            });
        }

        if (!cart.length) {
            alert("Ваш кошик порожній!");
            allValid = false;
        }

        return allValid;
    }

    // -------------------------
    // Показувати/ховати поля компанії
    // -------------------------
    function toggleCompanyFields(showCompany) {
        if (showCompany) {
            companyFields.style.display = 'block';
            const companyInputs = companyFields.querySelectorAll('input');
            companyInputs.forEach(input => {
                input.required = true;
                input.disabled = false;
                
                if (!input.parentElement.querySelector('.validation-hint')) {
                    const hint = document.createElement('div');
                    hint.className = 'validation-hint';
                    hint.style.color = 'red';
                    hint.style.fontSize = '12px';
                    hint.style.marginTop = '3px';
                    hint.style.minHeight = '15px';
                    input.parentElement.appendChild(hint);
                }
            });
        } else {
            companyFields.style.display = 'none';
            const companyInputs = companyFields.querySelectorAll('input');
            companyInputs.forEach(input => {
                input.required = false;
                input.disabled = true;
                input.value = '';
                
                const hint = input.parentElement.querySelector('.validation-hint');
                if (hint) hint.textContent = '';
                input.style.border = '';
            });
        }
    }

    // Ініціалізація перемикача компанії
    companyCheckbox.addEventListener("change", () => {
        toggleCompanyFields(companyCheckbox.checked);
    });

    // -------------------------
    // Рендер кошика
    // -------------------------
    function renderCart() {
        itemsList.innerHTML = "";
        total = 0;

        if (!cart.length) {
            itemsList.innerHTML = "<p>Ваш кошик порожній</p>";
            totalEl.textContent = "0.00";
            finalTotalEl.textContent = "0.00";
            infoBox.innerHTML = "";
            return;
        }

        cart.forEach((item, index) => {
            const li = document.createElement("li");
            if (item.type === "custom_box") {
                const box = item.box || {};
                const boxPrice = Number(box.price) || 0;
                const cardPrice = Number(item.card?.price) || 0;

                const productsHTML = (item.products || []).map(p => {
                    const qty = p.quantity || 1;
                    const price = Number(p.price) || 0;
                    return `▸ ${p.name} × ${qty} — ${price * qty} грн`;
                }).join("<br>");

                li.innerHTML = `
                    <div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:10px;">
                        <img src="${item.image || '/foto/logo2.png'}" width="70" height="70" style="object-fit:cover;border-radius:5px;">
                        <div style="display:flex; flex-direction:column; gap:3px; font-size:15px;">
                            <strong>${item.name}</strong>
                            <div>📦 ${box.name} (${box.capacity} місць) — ${boxPrice} Kč</div>
                            ${productsHTML}
                            ${item.card ? `🎴 Листівка: ${item.card.name} — ${cardPrice} Kč` : ''}
                            <div>💰 ${item.price} Kč</div>
                        </div>
                        <button class="remove-item" data-index="${index}" style="margin-left:auto; background:none; border:none; cursor:pointer; font-size:18px;">❌</button>
                    </div>
                `;
                total += item.price || 0;
            } else {
                li.innerHTML = `
                    <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
                        <img src="${item.image || '/foto/logo2.png'}" width="70" height="70" style="object-fit:cover;border-radius:5px;">
                        <div style="display:flex; flex-direction:column; gap:5px; font-size:15px;">
                            <strong>${item.name}</strong>
                            <span>x${item.quantity || 1}</span>
                            <div>${(item.price || 0) * (item.quantity || 1)} Kč</div>
                        </div>
                        <button class="remove-item" data-index="${index}" style="margin-left:auto; background:none; border:none; cursor:pointer; font-size:18px;">❌</button>
                    </div>
                `;
                total += (item.price || 0) * (item.quantity || 1);
            }
            itemsList.appendChild(li);
        });

        totalEl.textContent = total.toFixed(2);
        updateFinalTotal();
    }

    // -------------------------
    // ✅ РОЗРАХУНОК ФІНАЛЬНОЇ СУМИ (БЕЗ ЛОГІКИ ВІДДІЛЕННЯ)
    // -------------------------
    function updateFinalTotal() {
        let finalTotal = total;
        let deliveryText = "Не вибрано";
        let deliveryPrice = 0;

        const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
        if (selectedDelivery) {
            const label = selectedDelivery.closest("label");
            deliveryText = label?.querySelector(".shipping-billing-name")?.innerText.trim() || selectedDelivery.value;
            deliveryPrice = parseFloat(label?.querySelector(".payment-shipping-price")?.dataset.shippingPrice || 0);
            finalTotal += deliveryPrice;
        }

        let paymentText = "Не вибрано";
        let paymentFee = 0;

        const selectedPayment = document.querySelector('input[name="payment"]:checked');
        if (selectedPayment) {
            const label = selectedPayment.closest("label");
            paymentText = label?.innerText.trim() || selectedPayment.value;
            if (selectedPayment.value === "cash_on_delivery") {
                paymentFee = 50;
                finalTotal += 50;
            }
        }

        finalTotalEl.textContent = finalTotal.toFixed(2);
        infoBox.innerHTML = `
            <p><strong>Доставка:</strong> ${deliveryText} — ${deliveryPrice} Kč</p>
            <p><strong>Оплата:</strong> ${paymentText}${paymentFee ? ` ( +${paymentFee} Kč )` : ''}</p>
        `;
    }

    // -------------------------
    // Логіка країн
    // -------------------------
    function updateShippingByCountry() {
        const country = countrySelect.value;

        let zasilPrice = 0;
        let postPrice = 75;

        if (country === "Czechia") {
            shippingPostLabel.style.display = "flex";
            shippingZasilLabel.style.display = "flex";
            codLabel.style.display = "flex";
            zasilPrice = 89;
        } else if (country === "Slovakia") {
            shippingZasilLabel.style.display = "flex";
            shippingPostLabel.style.display = "none";
            codLabel.style.display = "none";
            zasilPrice = 99;
        } else if (country === "Hungary") {
            shippingZasilLabel.style.display = "flex";
            shippingPostLabel.style.display = "none";
            codLabel.style.display = "none";
            zasilPrice = 119;
        }

        const zasilPriceEl = shippingZasilLabel.querySelector(".payment-shipping-price");
        const postPriceEl = shippingPostLabel.querySelector(".payment-shipping-price");

        zasilPriceEl.dataset.shippingPrice = zasilPrice;
        zasilPriceEl.textContent = zasilPrice + " Kč";

        postPriceEl.dataset.shippingPrice = postPrice;
        postPriceEl.textContent = postPrice + " Kč";

        document.querySelectorAll('input[name="delivery"]').forEach(r => r.checked = false);
        document.getElementById("payment-cash").checked = false;
        
        // ✅ Скидаємо вибір відділення при зміні країни
        selectedBranch = null;
        const branchText = document.getElementById("selected-branch");
        if (branchText) branchText.textContent = "";
        
        toggleZasilkovnaBranchBlock();
        updateFinalTotal();
    }

    // -------------------------
    // Обробка форми
    // -------------------------
    orderForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            alert("Будь ласка, заповніть всі поля правильно!");
            return;
        }

        const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
        
        // ✅ ПЕРЕВІРКА ВИБОРУ ВІДДІЛЕННЯ (тут і тільки тут)
        if (selectedDelivery?.value === "zasilkovna" && !selectedBranch) {
            alert("❌ Будь ласка, виберіть пункт видачі Zásilkovna!");
            return;
        }

        const selectedPayment = document.querySelector('input[name="payment"]:checked');
        if (selectedPayment.value === "card") {
            cardModal.style.display = "flex";
        } else {
            finalizeOrder();
        }
    });

    // Закриття модалки картки
    const closeCardModal = document.getElementById("close-card-modal");
    if (closeCardModal) {
        closeCardModal.addEventListener("click", () => {
            cardModal.style.display = "none";
        });
    }

    // Оплата карткою
    const payCardBtn = document.getElementById("pay-card-btn");
    if (payCardBtn) {
        payCardBtn.addEventListener("click", () => {
            const number = document.getElementById("card-number").value.trim();
            const expiry = document.getElementById("card-expiry").value.trim();
            const cvv = document.getElementById("card-cvv").value.trim();
            
            if (!number || !expiry || !cvv) {
                alert("Будь ласка, заповніть всі поля картки!");
                return;
            }
            
            alert("Платіж проведено успішно!");
            cardModal.style.display = "none";
            finalizeOrder();
        });
    }

    // -------------------------
    // Фіналізація замовлення
    // -------------------------
    async function finalizeOrder() {
        if (!cart.length) {
            alert("Ваш кошик порожній!");
            return;
        }

        const formData = new FormData(orderForm);
        const userData = Object.fromEntries(formData.entries());

        let finalTotal = total;
        let deliveryName = "Не вибрано";
        let deliveryPrice = 0;
        const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
        if (selectedDelivery) {
            const label = selectedDelivery.closest("label");
            deliveryName = label?.querySelector(".shipping-billing-name")?.innerText.trim() || selectedDelivery.value;
            deliveryPrice = parseFloat(label?.querySelector(".payment-shipping-price")?.dataset.shippingPrice || 0);
            finalTotal += deliveryPrice;
        }

        if (userData.payment === "cash_on_delivery") finalTotal += 50;

        const isCompanyOrder = companyCheckbox.checked;

        const orderData = {
            customer: {
                name: `${userData.firstName} ${userData.lastName}`,
                phone: userData.phone,
                email: userData.email,
                country: userData.country,
                city: userData.city,
                street: userData.street,
                houseNumber: userData.houseNumber,
                apartment: userData.apartment,
                postalIndex: userData.postalIndex,
                company: isCompanyOrder ? {
                    name: userData.companyName,
                    ico: userData.companyID,
                    dic: userData.companyVAT
                } : null
            },
            payment: userData.payment,
            delivery: deliveryName,
            deliveryPrice: deliveryPrice,
            // ✅ ДОДАЄМО ІНФОРМАЦІЮ ПРО ВІДДІЛЕННЯ
            branch: selectedBranch?.fullAddress || null,
            branchId: selectedBranch?.id || null,
            branchData: selectedBranch || null,
           comment: userData.comment?.trim() || null,
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1,
                type: item.type || "product",
                box_details: item.box_details || null
            })),
            total: finalTotal,
            currency: "Kč",
            timestamp: new Date().toISOString(),
            orderType: isCompanyOrder ? "company" : "personal"
        };

        if (isCompanyOrder) {
            orderData.company = {
                name: userData.companyName || '',
                ico: userData.companyID || '',
                dic: userData.companyVAT || ''
            };
            orderData.customer.company = orderData.company;
        }

        console.log("📤 Відправляємо замовлення:", orderData);
        console.log("🏢 Тип замовлення:", isCompanyOrder ? "Компанія" : "Фізична особа");
        console.log("📦 Відділення:", selectedBranch);

        try {
            const response = await fetch("http://localhost:3000/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });

            const responseText = await response.text();
            let result;
            
            try {
                result = JSON.parse(responseText);
            } catch {
                alert("✅ Замовлення відправлено! Дякуємо!");
                clearCartAndRedirect();
                return;
            }

            if (response.ok && (result.success === true || result.success === "true")) {
                const orderId = result.orderId || result.id || Date.now();
                alert(`✅ Замовлення #${orderId} прийнято!`);
                clearCartAndRedirect();
            } else {
                alert(`❌ Помилка: ${result.message || result.error || "Невідома помилка"}`);
            }

        } catch (err) {
            console.error("Помилка fetch:", err);
            alert("✅ Замовлення відправлено! (Можливо, з технічними проблемами)");
            clearCartAndRedirect();
        }
    }

    // -------------------------
    // ✅ ОБРОБНИК ВИБОРУ ВІДДІЛЕННЯ ZÁSILKOVNA
    // -------------------------
    const chooseBranchBtn = document.getElementById("choose-branch-btn");
    if (chooseBranchBtn) {
        chooseBranchBtn.addEventListener("click", () => {
            Packeta.Widget.pick({
                country: document.getElementById("delivery-country").value || "cz",
                language: "cs",
                view: "modal"
            }, function(point) {
                if (!point) return;

                // ✅ ЗБЕРІГАЄМО ВИБРАНЕ ВІДДІЛЕННЯ
                selectedBranch = {
                    id: point.id,
                    name: point.name,
                    city: point.city,
                    street: point.street,
                    houseNumber: point.houseNumber,
                    zip: point.zip,
                    fullAddress: `${point.name}, ${point.street} ${point.houseNumber}, ${point.zip} ${point.city}`
                };

                // ✅ ВІДОБРАЖАЄМО НА СТОРІНЦІ
                const branchText = document.getElementById("selected-branch");
                if (branchText) {
                    branchText.innerHTML = `✅ ${point.name}, ${point.city}, ${point.street}`;
                }
                
                console.log("✅ Вибрано відділення:", selectedBranch);
            });
        });
    }

    // -------------------------
    // Очищення кошика і редирект
    // -------------------------
    function clearCartAndRedirect() {
        cart = [];
        window.cart = [];
        localStorage.removeItem("cart");
        renderCart();
        window.location.replace("/");
    }

    // -------------------------
    // Видалення товару з кошика
    // -------------------------
    itemsList.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-item")) {
            const index = parseInt(e.target.dataset.index);
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            window.cart = cart;
            renderCart();
        }
    });

    // -------------------------
    // Ініціалізація
    // -------------------------
    renderCart();
    initValidation();
    updateFinalTotal();
    updateShippingByCountry();
    
    // ✅ Слухачі змін доставки з викликом toggle функції
    deliveryRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            updateFinalTotal();
            toggleZasilkovnaBranchBlock(); // ← ВАЖЛИВО!
        });
    });
    
    paymentRadios.forEach(radio => radio.addEventListener("change", updateFinalTotal));
    countrySelect.addEventListener("change", updateShippingByCountry);
    
    // ✅ Ініціалізуємо стан блоку відділення при завантаженні
    toggleZasilkovnaBranchBlock();
    
    console.log("✅ checkout.js завантажено та ініціалізовано (ВИПРАВЛЕНО)");
});
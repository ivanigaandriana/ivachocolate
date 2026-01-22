
// document.addEventListener("DOMContentLoaded", () => {
//     let cart = JSON.parse(localStorage.getItem("cart")) || [];
//     const itemsList = document.getElementById("checkout-items");
//     const totalEl = document.getElementById("checkout-total");
//     const finalTotalEl = document.getElementById("checkout-final-total");
//     const infoBox = document.getElementById("checkout-info");
//     const paymentRadios = document.querySelectorAll('input[name="payment"]');
//     const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
//     const companyCheckbox = document.getElementById("company-order");
//     const companyFields = document.getElementById("company-fields");

//     let total = 0;

//     function renderCart() {
//         itemsList.innerHTML = "";
//         total = 0;

//         if (cart.length === 0) {
//             itemsList.innerHTML = "<p>Ваш кошик порожній</p>";
//         } else {
//             cart.forEach((item, index) => {
//                 const li = document.createElement("li");
//                 li.innerHTML = `
//                     <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
//                         <img src="${item.image}" width="70" height="70" style="object-fit:cover;border-radius:5px;">
//                         <div style="display:flex; flex-direction:column; gap:5px; font-size:15px;">
//                             <strong>${item.name}</strong>
//                             <span>x${item.quantity}</span>
//                             <div>${item.price * item.quantity} Kč</div>
//                         </div>
//                         <button class="remove-item" data-index="${index}" 
//                             style="margin-left:auto; background:none; border:none; cursor:pointer; font-size:18px;">❌</button>
//                     </div>
//                 `;
//                 itemsList.appendChild(li);
//                 total += item.price * item.quantity;
//             });
//         }

//         totalEl.textContent = total.toFixed(2);
//         updateFinalTotal();
//     }

//     function updateFinalTotal() {
//         let finalTotal = total;

//         // Доставка
//         let deliveryText = "Не вибрано";
//         let deliveryPrice = 0;
//         const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
//         if (selectedDelivery) {
//             const parent = selectedDelivery.closest("label");
//             deliveryPrice = parseFloat(parent.querySelector(".payment-shipping-price").dataset.shippingPrice);
//             deliveryText = parent.querySelector(".shipping-billing-name").textContent;
//             finalTotal += deliveryPrice;
//         }

//         // Оплата
//         let paymentText = "Не вибрано";
//         let paymentFee = 0;
//         const selectedPayment = document.querySelector('input[name="payment"]:checked');
//         if (selectedPayment) {
//             paymentText = selectedPayment.closest("label").innerText.trim();
//             if (selectedPayment.value === "cash_on_delivery") {
//                 paymentFee = 50;
//                 finalTotal += 50;
//             }
//         }

//         finalTotalEl.textContent = finalTotal.toFixed(2);
//         infoBox.innerHTML = `
//             <p><strong>Доставка:</strong> ${deliveryText} — ${deliveryPrice} Kč</p>
//             <p><strong>Оплата:</strong> ${paymentText}${paymentFee ? " (+" + paymentFee + " Kč)" : ""}</p>
//         `;
//     }

//     // Події зміни доставки / оплати
//     paymentRadios.forEach(radio => radio.addEventListener("change", updateFinalTotal));
//     deliveryRadios.forEach(radio => radio.addEventListener("change", updateFinalTotal));

//     // Показ полів компанії
//     companyCheckbox.addEventListener("change", () => {
//         companyFields.style.display = companyCheckbox.checked ? "block" : "none";
//     });

//     // Видалення товару
//     itemsList.addEventListener("click", (e) => {
//         if (e.target.classList.contains("remove-item")) {
//             const index = parseInt(e.target.dataset.index);
//             cart.splice(index, 1);
//             localStorage.setItem("cart", JSON.stringify(cart));
//             renderCart();
//         }
//     });

//     // Підтвердження замовлення
//     document.getElementById("order-form").addEventListener("submit", function(e) {
//         e.preventDefault();

//          // 🔐 GDPR перевірка
//     const consent = document.getElementById("privacy-consent");
//     if (!consent.checked) {
//         alert("Для оформлення замовлення необхідно погодитись на обробку персональних даних.");
//         return;
//     }

//         const formData = new FormData(this);
//         const userData = Object.fromEntries(formData.entries());

//         let finalTotal = total;
//         const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
//         if (selectedDelivery) {
//             const shippingPrice = parseFloat(selectedDelivery.closest("label").querySelector(".payment-shipping-price").dataset.shippingPrice);
//             finalTotal += shippingPrice;
//         }
//         if (userData.payment === "cash_on_delivery") finalTotal += 50;

//         const orderData = {
//             user: {
//                 name: userData.name,
//                 phone: userData.phone,
//                 email: userData.email,
//                 country: userData.country,
//                 city: userData.city,
//                 street: userData.street,
//                 houseNumber: userData.houseNumber,
//                 postalIndex: userData.postalIndex,
//                 delivery: userData.delivery,
//                 payment: userData.payment,
//                 comment: userData.comment || ""
//             },
//             company: companyCheckbox.checked ? {
//                 name: userData.companyName,
//                 id: userData.companyID,
//                 vat: userData.companyVAT
//             } : null,
//             cart: cart,
//             total: total,
//             finalTotal: finalTotal
//         };

//         console.log("Замовлення:", orderData);
//         alert("Замовлення успішно оформлено!");

//         localStorage.removeItem("cart");
//         window.location.href = "/pages/index.html";
//     });

//     renderCart(); // Показуємо кошик спочатку
// });
document.addEventListener("DOMContentLoaded", () => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const itemsList = document.getElementById("checkout-items");
    const totalEl = document.getElementById("checkout-total");
    const finalTotalEl = document.getElementById("checkout-final-total");
    const infoBox = document.getElementById("checkout-info");
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    const companyCheckbox = document.getElementById("company-order");
    const companyFields = document.getElementById("company-fields");
    const orderForm = document.getElementById("order-form");
    const cardModal = document.getElementById("card-modal");

    let total = 0;

    // -------------------------
    // Відображення кошика
    // -------------------------
    function renderCart() {
        itemsList.innerHTML = "";
        total = 0;

        if (cart.length === 0) {
            itemsList.innerHTML = "<p>Ваш кошик порожній</p>";
        } else {
            cart.forEach((item, index) => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
                        <img src="${item.image}" width="70" height="70" style="object-fit:cover;border-radius:5px;">
                        <div style="display:flex; flex-direction:column; gap:5px; font-size:15px;">
                            <strong>${item.name}</strong>
                            <span>x${item.quantity}</span>
                            <div>${item.price * item.quantity} Kč</div>
                        </div>
                        <button class="remove-item" data-index="${index}" 
                            style="margin-left:auto; background:none; border:none; cursor:pointer; font-size:18px;">❌</button>
                    </div>
                `;
                itemsList.appendChild(li);
                total += item.price * item.quantity;
            });
        }

        totalEl.textContent = total.toFixed(2);
        updateFinalTotal();
    }

    // -------------------------
    // Розрахунок фінальної суми
    // -------------------------
    function updateFinalTotal() {
        let finalTotal = total;
        let deliveryText = "Не вибрано";
        let deliveryPrice = 0;

        const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
        if (selectedDelivery) {
            const parent = selectedDelivery.closest("label");
            deliveryPrice = parseFloat(parent.querySelector(".payment-shipping-price").dataset.shippingPrice || 0);
            deliveryText = parent.querySelector(".shipping-billing-name").textContent;
            finalTotal += deliveryPrice;
        }

        let paymentText = "Не вибрано";
        let paymentFee = 0;
        const selectedPayment = document.querySelector('input[name="payment"]:checked');
        if (selectedPayment) {
            paymentText = selectedPayment.closest("label").innerText.trim();
            if (selectedPayment.value === "cash_on_delivery") {
                paymentFee = 50;
                finalTotal += 50;
            }
        }

        finalTotalEl.textContent = finalTotal.toFixed(2);
        infoBox.innerHTML = `
            <p><strong>Доставка:</strong> ${deliveryText} — ${deliveryPrice} Kč</p>
            <p><strong>Оплата:</strong> ${paymentText}${paymentFee ? " (+" + paymentFee + " Kč)" : ""}</p>
        `;
    }

    paymentRadios.forEach(radio => radio.addEventListener("change", updateFinalTotal));
    deliveryRadios.forEach(radio => radio.addEventListener("change", updateFinalTotal));

    // -------------------------
    // Показати/сховати поля компанії
    // -------------------------
    companyCheckbox.addEventListener("change", () => {
        companyFields.style.display = companyCheckbox.checked ? "block" : "none";
    });

    // -------------------------
    // Видалення товару з кошика
    // -------------------------
    itemsList.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-item")) {
            const index = parseInt(e.target.dataset.index);
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            renderCart();
        }
    });

    // -------------------------
    // Валідація картки
    // -------------------------
    function validateCardFields() {
        const number = document.getElementById("card-number").value.trim();
        const expiry = document.getElementById("card-expiry").value.trim();
        const cvv = document.getElementById("card-cvv").value.trim();
        if (!number || !expiry || !cvv) {
            alert("Будь ласка, заповніть всі поля картки!");
            return false;
        }
        return true;
    }

    // -------------------------
    // Валідація форми перед оформленням
    // -------------------------
    function validateForm() {
        let valid = true;

        // Обов'язкові поля
        const requiredFields = Array.from(orderForm.querySelectorAll("input[required], textarea[required]"));
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.border = "2px solid red";
                if (valid) field.focus();
                valid = false;
            } else {
                field.style.border = "";
            }
        });

        if (!document.querySelector('input[name="delivery"]:checked')) {
            alert("Будь ласка, виберіть спосіб доставки!");
            valid = false;
        }

        if (!document.querySelector('input[name="payment"]:checked')) {
            alert("Будь ласка, виберіть спосіб оплати!");
            valid = false;
        }

        if (!document.getElementById("privacy-consent").checked) {
            alert("Погодьтесь на обробку персональних даних.");
            valid = false;
        }

        // Перевірка полів компанії
        if (companyCheckbox.checked) {
            const companyInputs = companyFields.querySelectorAll("input");
            companyInputs.forEach(field => {
                if (!field.value.trim()) {
                    field.style.border = "2px solid red";
                    if (valid) field.focus();
                    valid = false;
                } else {
                    field.style.border = "";
                }
            });
        }

        return valid;
    }

    // -------------------------
    // Зняти червону підсвітку при введенні
    // -------------------------
    const allFields = orderForm.querySelectorAll("input[required], textarea[required]");
    allFields.forEach(field => {
        field.addEventListener("input", () => {
            if (field.value.trim()) field.style.border = "";
        });
    });

    // -------------------------
    // Обробка форми
    // -------------------------
    orderForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const selectedPayment = document.querySelector('input[name="payment"]:checked');
        if (selectedPayment.value === "card") {
            cardModal.style.display = "flex"; // показати модалку картки
        } else {
            finalizeOrder();
        }
    });

    // -------------------------
    // Закриття модалки картки
    // -------------------------
    document.getElementById("close-card-modal").addEventListener("click", () => {
        cardModal.style.display = "none";
    });

    // -------------------------
    // Оплата карткою
    // -------------------------
    document.getElementById("pay-card-btn").addEventListener("click", () => {
        if (!validateCardFields()) return;
        alert("Платіж проведено успішно!");
        cardModal.style.display = "none";
        finalizeOrder();
    });

    // -------------------------
    // Підтвердження замовлення
    // -------------------------
    function finalizeOrder() {
        const formData = new FormData(orderForm);
        const userData = Object.fromEntries(formData.entries());

        let finalTotal = total;
        const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
        if (selectedDelivery) {
            finalTotal += parseFloat(selectedDelivery.closest("label").querySelector(".payment-shipping-price").dataset.shippingPrice || 0);
        }
        if (userData.payment === "cash_on_delivery") finalTotal += 50;

        const orderData = {
            user: {
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                phone: userData.phone,
                email: userData.email,
                country: userData.country,
                city: userData.city,
                street: userData.street,
                houseNumber: userData.houseNumber,
                postalIndex: userData.postalIndex,
                delivery: userData.delivery,
                payment: userData.payment,
                comment: userData.comment || ""
            },
            company: companyCheckbox.checked ? {
                name: userData.companyName,
                id: userData.companyID,
                vat: userData.companyVAT
            } : null,
            cart: cart,
            total: total,
            finalTotal: finalTotal
        };

        console.log("Замовлення:", orderData);
        alert("Замовлення успішно оформлено!");
        localStorage.removeItem("cart");
        window.location.href = "/pages/index.html";
    }

    renderCart();
    updateFinalTotal();
});
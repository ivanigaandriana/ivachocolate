// chocolateNews3.js - ОНОВЛЕНИЙ КОД
document.addEventListener('DOMContentLoaded', function() {
    console.log('Formulář připraven...');
    
    const corporateForm = document.getElementById('corporate-contact-form');
    
    if (!corporateForm) return;
    
    // 1. Мінімальна дата
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 10);
        dateInput.min = minDate.toISOString().split('T')[0];
    }
    
    // 2. Валідація телефону
    const phoneInput = document.querySelector('input[name="Телефон"]');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            if (value.startsWith('420420')) {
                value = '420' + value.substring(6);
            }
            this.value = '+420 ' + value.substring(3).replace(/(\d{3})(?=\d)/g, '$1 ');
        });
    }
    
    // 3. Функція перемикання полів компанії (ВИПРАВЛЕНО!)
    function toggleCompanyFields(showCompany) {
        const companyBlock = document.getElementById('company-fields-block');
        if (!companyBlock) return;
        
        const companyInputs = companyBlock.querySelectorAll('input, select');
        
        if (showCompany) {
            // Показуємо поля компанії
            companyBlock.style.display = 'block';
            companyInputs.forEach(input => {
                input.required = true; // Робимо обов'язковими
                input.disabled = false;
            });
        } else {
            // Ховаємо поля компанії
            companyBlock.style.display = 'none';
            companyInputs.forEach(input => {
                input.required = false; // Знімаємо обов'язковість!
                input.disabled = true;
                input.value = ''; // Очищаємо значення
            });
        }
    }
    // 4. Валідація англійських/чеських букв
    // ------------------------------
    const latinCzechPattern = /^[A-Za-zÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž0-9\s-]+$/;
    const textFields = Array.from(corporateForm.querySelectorAll('input[type="text"], textarea'));

    textFields.forEach(field => {
        // Додаємо підказку для помилки
        const hint = document.createElement('div');
        hint.style.color = 'red';
        hint.style.fontSize = '12px';
        hint.style.marginTop = '3px';
        hint.className = 'validation-hint';
        field.parentNode.appendChild(hint);
         // Перевірка під час введення
        field.addEventListener('input', () => {
            if (field.value && !latinCzechPattern.test(field.value)) {
                hint.textContent = 'Використовуйте лише латинські або чеські букви та цифри.';
                field.style.border = '2px solid red';
            } else {
                hint.textContent = '';
                field.style.border = '';
            }
        });
    });
    
    // 4. Обробка форми
  corporateForm.addEventListener('submit', function(e) {
        e.preventDefault();

        let allValid = true;
        textFields.forEach(field => {
            if (field.value && !latinCzechPattern.test(field.value)) {
                allValid = false;
                field.style.border = '2px solid red';
                field.nextElementSibling.textContent = 'Використовуйте лише латинські або чеські букви та цифри.';
                field.focus();
            }
        });

        if (!allValid) {
            alert('Будь ласка, виправте поля, виділені червоним.');
            return;
        }

        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn ? submitBtn.innerHTML : 'Відправка';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Odesílám...';
            submitBtn.disabled = true;
        }

        const formData = new FormData(this);

        fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        })
        .then(res => {
            if (!res.ok) throw new Error();
            this.reset();
            showThankYouPopup();
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            toggleCompanyFields(true);
        })
        .catch(() => {
            alert('Помилка відправки. Спробуйте ще раз.');
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    });
    
    // 5. Плавна прокрутка
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                if(targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Ініціалізація
    toggleCompanyFields(true);
});

// 6. Функції для попапу
function showThankYouPopup() {
    const popup = document.getElementById('thank-you-popup');
    if (popup) {
        popup.style.display = 'flex';
        setTimeout(closeThankYouPopup, 8000);
    }
}

function closeThankYouPopup() {
    const popup = document.getElementById('thank-you-popup');
    if (popup) {
        popup.style.display = 'none';
        window.scrollTo({
            top: document.getElementById('contact-form').offsetTop - 100,
            behavior: 'smooth'
        });
    }
}

// 7. Глобальна функція для HTML (ВИПРАВЛЕНО!)
window.toggleCompanyFields = function(showCompany) {
    const companyBlock = document.getElementById('company-fields-block');
    if (!companyBlock) return;
    
    const companyInputs = companyBlock.querySelectorAll('input, select');
    
    if (showCompany) {
        companyBlock.style.display = 'block';
        companyInputs.forEach(input => {
            input.required = true;
            input.disabled = false;
        });
    } else {
        companyBlock.style.display = 'none';
        companyInputs.forEach(input => {
            input.required = false;
            input.disabled = true;
            input.value = '';
        });
    }
};
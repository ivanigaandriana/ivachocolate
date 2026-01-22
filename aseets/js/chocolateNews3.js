  // Обробка форми
        document.getElementById('corporate-contact-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Відправляємо...';
            submitBtn.disabled = true;
            
            // Симуляція відправки
            setTimeout(() => {
                alert('Дякую за запит! Я зв\'яжуся з вами протягом дня для обговорення деталей вашого корпоративного замовлення.');
                this.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Прокрутка до верху форми
                window.scrollTo({
                    top: document.getElementById('contact-form').offsetTop - 100,
                    behavior: 'smooth'
                });
            }, 1500);
        });
        
        // Встановлення мінімальної дати
        const dateInput = document.querySelector('input[type="date"]');
        if (dateInput) {
            const minDate = new Date();
            minDate.setDate(minDate.getDate() + 10);
            dateInput.min = minDate.toISOString().split('T')[0];
        }
        
        // Плавна прокрутка для посилань
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
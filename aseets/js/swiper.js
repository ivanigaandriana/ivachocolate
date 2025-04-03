const swiper = new Swiper('.swiper__container', {
    loop: true, // Зациклення
    slidesPerView: 1,
    spaceBetween: 0,
    centeredSlides: false,
     // Кількість слайдів, що відображаються
    autoplay: {
      delay: 3500, // Затримка між слайдами
      disableOnInteraction: false, // Не зупиняти автопрокрутку при взаємодії
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true, // Дозволити кліки на пагінацію
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
import 'dotenv/config';

function escapeHtml(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendTelegram(order) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const currency = order.currency || 'Kč';

    let message = `<b>🎁 НОВЕ ЗАМОВЛЕННЯ #${order.id}</b>\n\n`;

    // 👤 КЛІЄНТ
    message += `<b>👤 Клієнт:</b> ${escapeHtml(order.customer?.name)}\n`;
    message += `<b>📞 Телефон:</b> ${escapeHtml(order.customer?.phone)}\n`;

    if (order.customer?.email)
      message += `<b>📧 Email:</b> ${escapeHtml(order.customer.email)}\n`;

    // 🏢 ДАНІ КОМПАНІЇ (якщо є)
    if (order.company && (order.company.name || order.company.ico || order.company.dic)) {
      message += `\n<b>🏢 ДАНІ КОМПАНІЇ:</b>\n`;
      if (order.company.name) message += `<b>Назва:</b> ${escapeHtml(order.company.name)}\n`;
      if (order.company.ico) message += `<b>IČO:</b> ${escapeHtml(order.company.ico)}\n`;
      if (order.company.dic) message += `<b>DIČ:</b> ${escapeHtml(order.company.dic)}\n`;
      message += `<i>🔄 Замовлення оформлено на компанію</i>\n`;
    }

    // 💰 СУМА
    message += `\n<b>💰 Сума:</b> ${order.total} ${currency}\n`;
    message += `<b>📦 Товарів:</b> ${order.items?.length || 0}\n`;

    // 🛒 ТОВАРИ
    if (order.items?.length) {
      message += `\n<b>🛒 Замовлення:</b>\n`;

      let counter = 1;

      order.items.forEach(item => {
        // ===== CUSTOM BOX =====
        if (item.type === 'custom_box' && item.box_details) {
          const details = item.box_details;

          message += `\n<b>${counter}. 🎁 ПОДАРУНКОВИЙ БОКС</b>\n`;
          message += `   Назва: ${escapeHtml(item.name)}\n`;

          message += `   Коробка: ${escapeHtml(details.box_name)}`;
          if (details.box_capacity)
            message += ` (до ${details.box_capacity} товарів)`;
          message += `\n`;

          // Продукти
          if (details.products?.length) {
            message += `   Вміст (${details.products.length} товарів):\n`;

            details.products.forEach((p, i) => {
              const qty = p.product_quantity || p.quantity || 1;
              const price = p.product_price || p.price || 0;

              message += `   ${i + 1}. ${escapeHtml(p.product_name || p.name)} - ${price} ${currency}\n`;
            });
          }

          // Листівка
          if (details.card) {
            message += `   Листівка: ${escapeHtml(details.card.card_name || details.card.name)} - ${details.card.card_price || details.card.price || 0} ${currency}\n`;
          }

          // Реальна ціна боксу
          message += `   Вартість боксу: ${item.price} ${currency}\n`;

        }

        // ===== ЗВИЧАЙНИЙ ТОВАР =====
        else {
          const qty = item.quantity || 1;
          const price = (item.price || 0) * qty;

          message += `${counter}. ${escapeHtml(item.name)} - ${price} ${currency}\n`;
        }

        counter++;
      });
    }

    // 📍 АДРЕСА
    message += `\n<b>📍 АДРЕСА ДОСТАВКИ:</b>\n`;

    if (order.customer?.country)
      message += `Країна: ${escapeHtml(order.customer.country)}\n`;

    if (order.customer?.city)
      message += `Місто: ${escapeHtml(order.customer.city)}\n`;

    if (order.customer?.street)
      message += `Вулиця: ${escapeHtml(order.customer.street)}\n`;

    if (order.customer?.houseNumber)
      message += `Будинок: ${escapeHtml(order.customer.houseNumber)}\n`;

    if (order.customer?.apartment)
      message += `Квартира: ${escapeHtml(order.customer.apartment)}\n`;

    if (order.customer?.postalIndex)
      message += `Індекс: ${escapeHtml(order.customer.postalIndex)}\n`;
   // 💬 КОМЕНТАР
if (order.comment?.trim())
  message += `\n<b>💬 Коментар:</b> ${escapeHtml(order.comment)}\n`;

    // 🚚 ДОСТАВКА
    if (order.delivery)
      message += `\n<b>🚚 Доставка:</b> ${escapeHtml(order.delivery)}\n`;
    // 📍 ПУНКТ ВИДАЧІ (Zásilkovna / branch)
if (order.branch)
  message += `<b>📍 Пункт видачі:</b>\n${escapeHtml(order.branch)}\n`;

    // 💳 ОПЛАТА
    if (order.payment)
      message += `<b>💳 Оплата:</b> ${escapeHtml(order.payment)}\n`;

    // ⏰ ЧАС
    message += `\n⏰ Час: ${new Date(order.createdAt).toLocaleTimeString('uk-UA')}`;

    // Відправка
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();

    return result.ok;

  } catch (err) {
    console.error('Telegram error:', err);
    return false;
  }
}
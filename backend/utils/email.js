import nodemailer from "nodemailer";
import { generateInvoice } from "./generateInvoice.js";

// Допоміжні функції
function escapeHtml(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPrice(price) {
  const num = typeof price === 'number' ? price : parseFloat(price) || 0;
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

// Розрахунок загальної суми з ДПГ
export function calculateTotal(order) {
  const VAT_RATE = 0.21;

  let totalWithVAT = 0;

  // Товари та бокси
  order.items.forEach(item => {
    if (item.type === "custom_box" || item.name?.includes("ПОДАРУНКОВИЙ БОКС")) {
      totalWithVAT += item.price || 0;
    } else {
      totalWithVAT += (item.price || 0) * (item.quantity || 1);
    }
  });

  // Доставка
  const deliveryPrice = order.deliveryPrice || (order.delivery ? extractPriceFromDelivery(order.delivery) : 89);
  totalWithVAT += deliveryPrice;

  // Добірка
  const codFee = (order.payment === "cash_on_delivery" || order.payment === "dobírka") ? 50 : 0;
  totalWithVAT += codFee;

  // Фінальний бухгалтерський розрахунок
  totalWithVAT = +totalWithVAT.toFixed(2);
  const totalWithoutVAT = +(totalWithVAT / (1 + VAT_RATE)).toFixed(2);
  const totalVAT = +(totalWithVAT - totalWithoutVAT).toFixed(2);

  const deliveryWithoutVAT = +(deliveryPrice / (1 + VAT_RATE)).toFixed(2);
  const deliveryVAT = +(deliveryPrice - deliveryWithoutVAT).toFixed(2);

  const codWithoutVAT = +(codFee / (1 + VAT_RATE)).toFixed(2);
  const codVAT = +(codFee - codWithoutVAT).toFixed(2);

  return {
    totalWithVAT,
    totalWithoutVAT,
    totalVAT,
    deliveryPrice,
    deliveryWithoutVAT,
    deliveryVAT,
    codFee,
    codWithoutVAT,
    codVAT
  };
}

// Функція для детального боксу
function createGiftBoxHTML(box) {
  if (!box || (box.type !== "custom_box" && !box.name?.includes("ПОДАРУНКОВИЙ БОКС"))) {
    return "";
  }

  const boxName = box.name?.replace(/🎁\s*ПОДАРУНКОВИЙ БОКС[:\s]*/i, "").trim() || "Gift Box";
  const boxCapacity = box.box_details?.box_capacity ? ` (до ${box.box_details.box_capacity} товарів)` : "";
  const baseBoxPrice = box.box_details?.box_price || box.price || 0;
  const boxPrice = box.price || 0;
  const boxWithoutVAT = boxPrice / 1.21;
  const boxVAT = boxPrice - boxWithoutVAT;

  let html = `
    <div style="margin: 15px 0; padding: 15px; background: #fff8e1; border-radius: 8px; border-left: 4px solid #ff9800;">
      <h3 style="color: #e65100; margin-top: 0;">🎁 ПОДАРУНКОВИЙ БОКС / GIFT BOX</h3>
      <p><strong>Назва / Name:</strong> ${escapeHtml(boxName)}</p>
      <p><strong>Коробка / Box:</strong> ${escapeHtml(box.box_details?.box_name || boxName)}${boxCapacity} - ${formatPrice(baseBoxPrice)} Kč</p>
  `;

  // Товари в боксі
  if (box.box_details?.products && box.box_details.products.length > 0) {
    html += `<p><strong>Вміст (${box.box_details.products.length} товарів) / Content:</strong></p><ul style="margin-top: 5px;">`;

    box.box_details.products.forEach((product, index) => {
      const productName = product.product_name || product.name || "Товар";
      const productQuantity = product.product_quantity || product.quantity || 1;
      const productPrice = product.product_price || product.price || 0;
      const totalProductPrice = productPrice * productQuantity;

      const priceWithoutVAT = productPrice / 1.21;
      const vatPerItem = productPrice - priceWithoutVAT;

      html += `
        <li style="margin-bottom: 5px;">
          <strong>${index + 1}. ${escapeHtml(productName)}</strong>
          ${productQuantity > 1 ? ` ×${productQuantity}` : ''}
          - ${formatPrice(totalProductPrice)} Kč
          <br>
          <small style="color: #666; font-size: 12px;">
            (bez DPH: ${formatPrice(priceWithoutVAT * productQuantity)} Kč, 
            DPH: ${formatPrice(vatPerItem * productQuantity)} Kč)
          </small>
        </li>
      `;
    });

    html += `</ul>`;
  }

  // Листівка
  if (box.box_details?.card) {
    const cardName = box.box_details.card.card_name || box.box_details.card.name || "Листівка";
    const cardPrice = box.box_details.card.card_price || box.box_details.card.price || 0;

    if (cardPrice > 0) {
      const cardWithoutVAT = cardPrice / 1.21;
      const cardVAT = cardPrice - cardWithoutVAT;

      html += `
        <p><strong>Листівка / Greeting card:</strong> ${escapeHtml(cardName)} - ${formatPrice(cardPrice)} Kč
        <br>
        <small style="color: #666; font-size: 12px;">
          (bez DPH: ${formatPrice(cardWithoutVAT)} Kč, DPH: ${formatPrice(cardVAT)} Kč)
        </small>
        </p>
      `;
    }
  }

  html += `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ffcc80;">
        <p style="font-weight: bold; color: #e65100;">
          Вартість боксу / Box value: ${formatPrice(boxPrice)} Kč
        </p>
        <p style="font-size: 13px; color: #666; margin: 5px 0 0 0;">
          (bez DPH: ${formatPrice(boxWithoutVAT)} Kč, DPH 21%: ${formatPrice(boxVAT)} Kč)
        </p>
      </div>
    </div>
  `;

  return html;
}

export async function sendOrderEmail(order) {
  try {
    console.log("📧 Початок відправки email для замовлення:", order.id);

    // Налаштування SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.seznam.cz",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SEZNAM_USER,
        pass: process.env.SEZNAM_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const totals = calculateTotal(order);
    console.log("💰 Розраховані суми:", totals);
    
    // Генерація PDF
    console.log("📄 Генерація PDF...");
    const invoicePath = await generateInvoice({
      ...order,
      total: totals.totalWithVAT,
      deliveryPrice: totals.deliveryPrice
    });
    console.log("✅ PDF згенеровано:", invoicePath);

    // ✅ HTML для адреси доставки
    function getDeliveryAddressHTML(order) {
      if (!order.customer) return '';
      
      let addressHTML = `
        <div style="margin: 20px 0; padding: 20px; background: #e8f0fe; border-radius: 8px; border: 1px solid #bbdefb;">
          <h3 style="color: #0d47a1; margin-top: 0;">📦 Doručovací adresa / Delivery address</h3>
          <table style="width: 100%; border-collapse: collapse;">
      `;

      if (order.customer.country) {
        addressHTML += `<tr><td style="padding: 5px; width: 150px;"><strong>Země / Country:</strong></td><td style="padding: 5px;">${escapeHtml(order.customer.country)}</td></tr>`;
      }
      
      if (order.customer.city) {
        addressHTML += `<tr><td style="padding: 5px;"><strong>Město / City:</strong></td><td style="padding: 5px;">${escapeHtml(order.customer.city)}</td></tr>`;
      }
      
      if (order.customer.street || order.customer.houseNumber) {
        addressHTML += `<tr><td style="padding: 5px;"><strong>Ulice / Street:</strong></td><td style="padding: 5px;">${escapeHtml(order.customer.street || '')} ${escapeHtml(order.customer.houseNumber || '')}</td></tr>`;
      }
      
      if (order.customer.apartment) {
        addressHTML += `<tr><td style="padding: 5px;"><strong>Byt / Apartment:</strong></td><td style="padding: 5px;">${escapeHtml(order.customer.apartment)}</td></tr>`;
      }
      
      if (order.customer.postalIndex) {
        addressHTML += `<tr><td style="padding: 5px;"><strong>PSČ / Postal code:</strong></td><td style="padding: 5px;">${escapeHtml(order.customer.postalIndex)}</td></tr>`;
      }

      // ✅ Відділення Zásilkovna
      if (order.branch) {
        addressHTML += `
          <tr>
            <td style="padding: 5px;"><strong>📮 Výdejní místo / Pickup point:</strong></td>
            <td style="padding: 5px; background: #fff3e0; border-radius: 4px;">
              <strong style="color: #e65100;">${escapeHtml(order.branch)}</strong>
            </td>
          </tr>
        `;
      }

      addressHTML += `</table></div>`;
      
      return addressHTML;
    }

    // ✅ HTML для компанії (B2B)
    function getCompanyHTML(order) {
      if (!order.customer?.company && !order.company) return '';

      const company = order.customer?.company || order.company || {};
      
      return `
        <div style="margin: 20px 0; padding: 20px; background: #e8f5e9; border-radius: 8px; border: 1px solid #a5d6a7;">
          <h3 style="color: #1b5e20; margin-top: 0;">🏢 Firemní údaje / Company details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${company.name ? `<tr><td style="padding: 5px; width: 150px;"><strong>Název firmy / Company name:</strong></td><td style="padding: 5px;">${escapeHtml(company.name)}</td></tr>` : ''}
            ${company.ico ? `<tr><td style="padding: 5px;"><strong>IČO / Company ID:</strong></td><td style="padding: 5px;">${escapeHtml(company.ico)}</td></tr>` : ''}
            ${company.dic ? `<tr><td style="padding: 5px;"><strong>DIČ / VAT ID:</strong></td><td style="padding: 5px;">${escapeHtml(company.dic)}</td></tr>` : ''}
          </table>
        </div>
      `;
    }

    // ✅ Платіжна інформація (оновлена)
    function getPaymentInfoHTML(order, totals) {
      if (order.payment !== 'bank' && order.payment !== 'bank_transfer') return '';

      return `
        <div style="margin: 20px 0; padding: 20px; background: #e8f5e9; border-radius: 8px; border: 1px solid #c8e6c9;">
          <h3 style="color: #2e7d32; margin-top: 0;">💳 Platba bankovním převodem / Bank transfer payment</h3>
          <p style="font-size: 16px;">Prosíme zaplaťte částku <strong style="font-size: 20px; color: #d32f2f;">${formatPrice(totals.totalWithVAT)} Kč</strong> na níže uvedený účet:</p>
          
          <table style="width: 100%; margin: 15px 0; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <tr style="background: #f1f8e9;">
              <td style="padding: 12px; border-bottom: 1px solid #ddd; width: 200px;"><strong>Číslo účtu:</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #ddd;"><code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 16px;">CZ6508000000192000145399</code></td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Banka:</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #ddd;">Česká spořitelna</td>
            </tr>
            <tr style="background: #f1f8e9;">
              <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Částka:</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong style="color: #d32f2f;">${formatPrice(totals.totalWithVAT)} Kč</strong></td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #ddd;"><strong>Variabilní symbol:</strong></td>
              <td style="padding: 12px; border-bottom: 1px solid #ddd;"><code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${order.id}</code></td>
            </tr>
            <tr style="background: #f1f8e9;">
              <td style="padding: 12px;"><strong>Zpráva pro příjemce:</strong></td>
              <td style="padding: 12px;">Iva Chocolate Order ${order.id}</td>
            </tr>
          </table>
          
          <div style="margin-top: 15px; padding: 15px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;">
            <p style="margin: 0; font-size: 15px;">
              ⏰ <strong>Platbu prosíme proveďte do 2 hodin pro rychlé zpracování objednávky</strong><br>
              <span style="color: #666;">Fast-track your order: Pay within 2 hours for priority processing.</span>
            </p>
          </div>
        </div>
      `;
    }

    // HTML список товарів
    let itemsHTML = '';
    let regularItems = [];
    let giftBoxes = [];

    order.items.forEach(item => {
      if (item.type === "custom_box" || item.name?.includes("ПОДАРУНКОВИЙ БОКС")) {
        giftBoxes.push(item);
      } else {
        regularItems.push(item);
      }
    });

    // Звичайні товари
    if (regularItems.length > 0) {
      itemsHTML += `
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 15px; border: 1px solid #dee2e6;">
          <thead>
            <tr style="background: #8B4513; color: white;">
              <th style="padding: 12px; text-align: left;">Produkt / Product</th>
              <th style="padding: 12px; text-align: center;">Množství / Qty</th>
              <th style="padding: 12px; text-align: right;">Cena / Price</th>
              <th style="padding: 12px; text-align: right;">Celkem / Total</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      regularItems.forEach(item => {
        const price = item.price || 0;
        const quantity = item.quantity || 1;
        const total = price * quantity;
        const withoutVAT = total / 1.21;
        const vat = total - withoutVAT;
        
        itemsHTML += `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${escapeHtml(item.name || "Produkt")}</td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${quantity}</td>
            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">${formatPrice(price)} Kč</td>
            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6; font-weight: bold;">${formatPrice(total)} Kč</td>
          </tr>
          <tr style="background: #f9f9f9; font-size: 13px;">
            <td colspan="3" style="padding: 8px 12px; color: #666; border-bottom: 1px solid #dee2e6;">
              bez DPH / without VAT: ${formatPrice(withoutVAT)} Kč, DPH 21%: ${formatPrice(vat)} Kč
            </td>
            <td style="padding: 8px 12px; color: #666; text-align: right; border-bottom: 1px solid #dee2e6;">
              s DPH / with VAT: ${formatPrice(total)} Kč
            </td>
          </tr>
        `;
      });
      
      itemsHTML += `</tbody></table>`;
    }

    // Подарункові бокси
    giftBoxes.forEach(box => {
      itemsHTML += createGiftBoxHTML(box);
    });

    // ✅ RESPONSIVE CSS
    const responsiveCSS = `
      @media screen and (max-width: 600px) {
        body { padding: 10px !important; }
        .email-container { padding: 15px !important; }
        table { width: 100% !important; }
        td { display: block !important; width: 100% !important; box-sizing: border-box; }
        .price { float: right; }
        h1 { font-size: 24px !important; }
      }
    `;

    // Лист клієнту
    const customerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Potvrzení objednávky #${order.id}</title>
        <style>${responsiveCSS}</style>
      </head>
      <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px;">
        <div class="email-container" style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); padding: 30px; text-align: center;">
            <img src="https://ivachocolate.store/foto/logo2.png" alt="Iva Chocolate" style="max-width: 180px; margin-bottom: 15px;">
            <h1 style="color: white; margin: 10px 0 5px; font-size: 28px; letter-spacing: 1px;">Děkujeme za objednávku!</h1>
            <p style="color: #FFE4C4; margin: 0; font-size: 18px;">Thank you for your order! 🍫</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            
            <!-- Order ID -->
            <div style="text-align: center; margin-bottom: 25px; padding: 20px; background: #f8f0e3; border-radius: 10px; border: 1px solid #e0c9af;">
              <h2 style="color: #8B4513; margin: 0; font-size: 20px;">Číslo objednávky / Order ID</h2>
              <p style="font-size: 28px; font-weight: bold; color: #e74c3c; margin: 10px 0 0; letter-spacing: 2px;">${order.id}</p>
              <p style="color: #666; margin: 5px 0 0;">${new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <!-- Delivery Address -->
            ${getDeliveryAddressHTML(order)}
            
            <!-- Company Info -->
            ${getCompanyHTML(order)}

            <!-- Order Summary -->
            <div style="margin: 25px 0;">
              <h3 style="color: #8B4513; border-bottom: 2px solid #8B4513; padding-bottom: 10px; font-size: 22px;">
                🛒 Přehled objednávky / Order summary
              </h3>
              
              ${itemsHTML}
              
              <!-- Totals -->
              <div style="margin-top: 30px; background: #f9f9f9; border-radius: 10px; padding: 20px; border: 1px solid #e0e0e0;">
                
                <!-- Delivery -->
                ${totals.deliveryPrice > 0 ? `
                  <div style="margin: 10px 0; padding: 10px; border-bottom: 1px solid #ddd;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 16px; color: #555;">
                        <strong>🚚 Doprava / Delivery:</strong> ${getDeliveryDescription(order.delivery)}
                      </span>
                      <span style="font-size: 18px; font-weight: bold; color: #2c3e50;">${formatPrice(totals.deliveryPrice)} Kč</span>
                    </div>
                    <div style="font-size: 13px; color: #777; margin-top: 5px;">
                      bez DPH: ${formatPrice(totals.deliveryWithoutVAT)} Kč | DPH 21%: ${formatPrice(totals.deliveryVAT)} Kč
                    </div>
                  </div>
                ` : ''}
                
                <!-- COD Fee -->
                ${totals.codFee > 0 ? `
                  <div style="margin: 10px 0; padding: 10px; border-bottom: 1px solid #ddd;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 16px; color: #555;">
                        <strong>💵 Poplatek za dobírku / COD fee</strong>
                      </span>
                      <span style="font-size: 18px; font-weight: bold; color: #2c3e50;">${formatPrice(totals.codFee)} Kč</span>
                    </div>
                    <div style="font-size: 13px; color: #777; margin-top: 5px;">
                      bez DPH: ${formatPrice(totals.codWithoutVAT)} Kč | DPH 21%: ${formatPrice(totals.codVAT)} Kč
                    </div>
                  </div>
                ` : ''}
                
                <!-- Final Totals -->
                <div style="margin-top: 20px; padding: 20px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #e65100;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 16px; color: #555;">Mezisoučet bez DPH / Subtotal without VAT:</span>
                    <span style="font-size: 18px; font-weight: bold;">${formatPrice(totals.totalWithoutVAT)} Kč</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #ffb74d;">
                    <span style="font-size: 16px; color: #555;">DPH 21% / VAT 21%:</span>
                    <span style="font-size: 18px; font-weight: bold;">${formatPrice(totals.totalVAT)} Kč</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span style="font-size: 20px; font-weight: bold; color: #8B4513;">CELKEM S DPH / TOTAL WITH VAT:</span>
                    <span style="font-size: 28px; font-weight: bold; color: #e74c3c;">${formatPrice(totals.totalWithVAT)} Kč</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Info -->
            ${getPaymentInfoHTML(order, totals)}

            <!-- Invoice Info -->
            <div style="margin: 25px 0; padding: 20px; background: #f0f7ff; border-radius: 10px; border: 1px solid #bbdefb;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 32px;">📄</span>
                <div>
                  <h3 style="color: #0d47a1; margin: 0 0 5px;">Faktura / Invoice</h3>
                  <p style="margin: 0; color: #555;">
                    Faktura v PDF formátu s podrobným rozpisem DPH je přiložena k tomuto emailu.<br>
                    <span style="font-size: 14px;">Invoice in PDF format with detailed VAT breakdown is attached.</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #f0f0f0; text-align: center;">
              <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                Máte nějaké otázky? Neváhejte nás kontaktovat!<br>
                <span style="font-size: 14px;">Any questions? Feel free to contact us!</span>
              </p>
              
              <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="text-align: center;">
                  <span style="font-size: 20px;">📧</span><br>
                  <a href="mailto:ivachocolate.store@seznam.cz" style="color: #8B4513; text-decoration: none; font-weight: bold;">ivachocolate.store@seznam.cz</a>
                </div>
                <div style="text-align: center;">
                  <span style="font-size: 20px;">📞</span><br>
                  <a href="tel:+420000000000" style="color: #8B4513; text-decoration: none; font-weight: bold;">+420 000 000 000</a>
                </div>
              </div>
              
              <div style="margin-top: 30px;">
                <p style="margin: 5px 0; color: #8B4513; font-size: 18px; font-weight: bold;">Iva Chocolate Team 🍫</p>
                <p style="margin: 5px 0; color: #999; font-size: 13px;">
                  © ${new Date().getFullYear()} Iva Chocolate. Všechna práva vyhrazena.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Лист адміну (оновлений)
    const adminHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nová objednávka #${order.id}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
          
          <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎁 NOVÁ OBJEDNÁVKA #${order.id}</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
            
            <!-- Customer Info -->
            <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">👤 Zákazník</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; width: 150px;"><strong>Jméno:</strong></td><td style="padding: 8px;">${escapeHtml(order.customer.name || '')}</td></tr>
                <tr><td style="padding: 8px;"><strong>Email:</strong></td><td style="padding: 8px;"><a href="mailto:${escapeHtml(order.customer.email || '')}" style="color: #e74c3c;">${escapeHtml(order.customer.email || '')}</a></td></tr>
                <tr><td style="padding: 8px;"><strong>Telefon:</strong></td><td style="padding: 8px;"><a href="tel:${escapeHtml(order.customer.phone || '')}" style="color: #e74c3c;">${escapeHtml(order.customer.phone || '')}</a></td></tr>
              </table>
            </div>

            <!-- Delivery Address (Admin) -->
            <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">📦 Doručení</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; width: 150px;"><strong>Způsob:</strong></td><td style="padding: 8px;">${getDeliveryDescription(order.delivery)}</td></tr>
                ${order.customer.country ? `<tr><td style="padding: 8px;"><strong>Země:</strong></td><td style="padding: 8px;">${escapeHtml(order.customer.country)}</td></tr>` : ''}
                ${order.customer.city ? `<tr><td style="padding: 8px;"><strong>Město:</strong></td><td style="padding: 8px;">${escapeHtml(order.customer.city)}</td></tr>` : ''}
                ${order.customer.street ? `<tr><td style="padding: 8px;"><strong>Ulice:</strong></td><td style="padding: 8px;">${escapeHtml(order.customer.street || '')} ${escapeHtml(order.customer.houseNumber || '')}</td></tr>` : ''}
                ${order.customer.apartment ? `<tr><td style="padding: 8px;"><strong>Byt:</strong></td><td style="padding: 8px;">${escapeHtml(order.customer.apartment)}</td></tr>` : ''}
                ${order.customer.postalIndex ? `<tr><td style="padding: 8px;"><strong>PSČ:</strong></td><td style="padding: 8px;">${escapeHtml(order.customer.postalIndex)}</td></tr>` : ''}
                ${order.branch ? `
                <tr>
                  <td style="padding: 8px;"><strong>📮 Výdejní místo:</strong></td>
                  <td style="padding: 8px; background: #fff3e0;"><strong>${escapeHtml(order.branch)}</strong></td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Company Info (Admin) -->
            ${getCompanyHTML(order)}

            <!-- Payment Info (Admin) -->
            <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #f39c12; padding-bottom: 10px;">💰 Platba</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; width: 150px;"><strong>Způsob platby:</strong></td><td style="padding: 8px;"><strong>${getPaymentMethodName(order.payment)}</strong></td></tr>
                <tr><td style="padding: 8px;"><strong>Celkem s DPH:</strong></td><td style="padding: 8px; font-size: 18px; font-weight: bold; color: #27ae60;">${formatPrice(totals.totalWithVAT)} Kč</td></tr>
                <tr><td style="padding: 8px;"><strong>Mezisoučet bez DPH:</strong></td><td style="padding: 8px;">${formatPrice(totals.totalWithoutVAT)} Kč</td></tr>
                <tr><td style="padding: 8px;"><strong>DPH 21%:</strong></td><td style="padding: 8px;">${formatPrice(totals.totalVAT)} Kč</td></tr>
                <tr><td style="padding: 8px;"><strong>Doprava:</strong></td><td style="padding: 8px;">${formatPrice(totals.deliveryPrice)} Kč (bez DPH: ${formatPrice(totals.deliveryWithoutVAT)} Kč, DPH: ${formatPrice(totals.deliveryVAT)} Kč)</td></tr>
                ${totals.codFee > 0 ? `<tr><td style="padding: 8px;"><strong>Dobírka:</strong></td><td style="padding: 8px;">${formatPrice(totals.codFee)} Kč (bez DPH: ${formatPrice(totals.codWithoutVAT)} Kč, DPH: ${formatPrice(totals.codVAT)} Kč)</td></tr>` : ''}
              </table>
            </div>

            <!-- Order Items -->
            <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">🛒 Položky</h2>
              ${itemsHTML}
            </div>

            <!-- PDF Link -->
            <div style="padding: 15px; background: #f1f8e9; border-radius: 5px; border-left: 4px solid #27ae60;">
              <p style="margin: 0; font-size: 14px;">
                📄 <strong>Faktura:</strong> PDF je přiloženo k emailu a odesláno zákazníkovi.
              </p>
            </div>

          </div>
        </div>
      </body>
      </html>
    `;

    // Вкладення та відправка
    const attachments = invoicePath ? [{
      filename: `faktura_${order.id}.pdf`,
      path: invoicePath,
      contentType: 'application/pdf'
    }] : [];

    const adminMail = {
      from: `"Iva Chocolate" <${process.env.SEZNAM_USER}>`,
      to: process.env.STORE_EMAIL,
      subject: `🎁 NOVÁ OBJEDNÁVKA #${order.id} - ${formatPrice(totals.totalWithVAT)} Kč - ${order.customer.name || 'Zákazník'}`,
      html: adminHTML,
      attachments
    };

    const customerMail = {
      from: `"Iva Chocolate" <${process.env.SEZNAM_USER}>`,
      to: order.customer.email,
      bcc: process.env.STORE_EMAIL,
      subject: `✅ Potvrzení objednávky #${order.id} - ${formatPrice(totals.totalWithVAT)} Kč - Děkujeme! 🍫`,
      html: customerHTML,
      attachments
    };

    console.log("📤 Відправка email адміну...");
    await transporter.sendMail(adminMail);
    console.log("✅ Email адміну відправлено");

    console.log("📤 Відправка email клієнту...");
    await transporter.sendMail(customerMail);
    console.log("✅ Email клієнту відправлено");

    return {
      success: true,
      invoicePath: invoicePath,
      totals: totals
    };

  } catch (error) {
    console.error("❌ Email sending error:", error);
    return { success: false, error: error.message };
  }
}

// Інші допоміжні функції
function getPaymentMethodName(paymentMethod) {
  const methods = {
    'bank': 'Bankovní převod',
    'bank_transfer': 'Bankovní převod',
    'card': 'Platba kartou',
    'cash_on_delivery': 'Dobírka',
    'dobírka': 'Dobírka'
  };
  return methods[paymentMethod] || paymentMethod;
}

function getDeliveryDescription(delivery) {
  if (!delivery) return "Standardní doprava";

  const deliveryStr = delivery.toLowerCase();

  if (deliveryStr.includes('express')) return "Expresní doprava";
  if (deliveryStr.includes('standard')) return "Standardní doprava";
  if (deliveryStr.includes('economy')) return "Ekonomická doprava";
  if (deliveryStr.includes('free')) return "Doprava zdarma";
  if (deliveryStr.includes('pošta') || deliveryStr.includes('posta')) return "Česká pošta";
  if (deliveryStr.includes('zasilkovna')) return "Zásilkovna";

  return delivery;
}

function extractPriceFromDelivery(deliveryText) {
  if (!deliveryText || typeof deliveryText !== 'string') return 89;
  
  const priceMatch = deliveryText.match(/(\d+)/);
  if (priceMatch) return parseInt(priceMatch[1], 10);
  
  if (deliveryText.includes('119')) return 119;
  if (deliveryText.includes('89')) return 89;
  if (deliveryText.includes('69')) return 69;
  if (deliveryText.includes('59')) return 59;
  
  return 89;
}

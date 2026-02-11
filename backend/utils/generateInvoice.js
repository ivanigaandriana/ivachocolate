import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
// 🔤 ПІДТРИМКА КИРИЛИЦІ + ЧЕСЬКОЇ
const fontRegularPath = path.join(process.cwd(), "fonts", "DejaVuSans.ttf");
const fontBoldPath = path.join(process.cwd(), "fonts", "DejaVuSans-Bold.ttf");

// Константи
const VAT_RATE = 0.21; // 21% ДПГ для Чехії
const BOX_PRICES = {
  "Small box": 50,
  "Medium box": 70,
  "Big box": 100,
  "Маленька коробка": 50,
  "Середня коробка": 70,
  "Велика коробка": 100
};
export async function generateInvoice(order) {
  return new Promise(async (resolve, reject) => {
    try {
      const fileName = `invoice_${order.id}.pdf`;
      const invoicesDir = path.join(process.cwd(), "invoices");

      if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });

      const filePath = path.join(invoicesDir, fileName);
      
      // Використовуємо стандартні шрифти
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4',
        bufferPages: true,
      
      });
      // 🔤 реєструємо шрифти
doc.registerFont("DejaVu", fontRegularPath);
doc.registerFont("DejaVu-Bold", fontBoldPath);
// 🔤 ставимо за замовчуванням
doc.font("DejaVu")
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // -------------------------
      // ШАПКА
      // -------------------------
      const logoPath = path.join(process.cwd(), "assets", "logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 40, { width: 120 });
      }

      doc.fontSize(10)
        .text("IVA CHOCOLATE", { align: "right" })
        .moveDown(0.2)
        .text("ICO: 12345678", { align: "right" })
       
        .moveDown(0.2)
        .text("Email: ivachocolate.store@seznam.cz", { align: "right" })
        .moveDown(0.2)
        .text("Tel: +420 000 000 000", { align: "right" })
        .moveDown(0.2)
        .text("Adresa: Ulicni 123, Praha", { align: "right" });

      doc.moveDown(4);

      // -------------------------
      // ЗАГОЛОВОК ФАКТУРИ
      // -------------------------
      doc.fontSize(20)
        .font('DejaVu-Bold')
        .text("FAKTURA / INVOICE", { align: "center" })
        .moveDown(1);

      doc.fontSize(10)
        .font('DejaVu')
        .text(`Cislo faktury / Invoice #: ${order.id}`, { align: "center" })
        .text(`Datum vystaveni / Issue date: ${formatDate(new Date())}`, { align: "center" })
        .text(`Datum splatnosti / Due date: ${formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))}`, { align: "center" });

      doc.moveDown(2);

      // -------------------------
      // БЛОКИ КОМПАНІЇ ТА КЛІЄНТА
      // -------------------------
      const startY = doc.y;
      
      doc.fontSize(11)
        .font('DejaVu-Bold')
        .text("Dodavatel / Supplier:", 40, startY);
      
      doc.fontSize(10)
        .font('DejaVu')
        .text("IVA CHOCOLATE s.r.o.")
        .text("ICO: 12345678")
      
        .text("Ulicni 123")
        .text("Praha 1, 110 00")
        .text("Ceska republika");

      doc.fontSize(11)
        .font('DejaVu-Bold')
        .text("Odběratel / Customer:", 300, startY);
      
      doc.fontSize(10)
        .font('DejaVu')
        .text(order.customer.name || "", 300)
        .text(order.customer.email || "", 300)
        .text(order.customer.phone || "", 300);
       // ДАНІ КОМПАНІЇ (якщо є)
      if (order.company && (order.company.name || order.company.ico || order.company.dic)) {
        // Назва компанії
        if (order.company.name) {
          doc.text(`${order.company.name}`, 300);
        }
        
        // IČO
        if (order.company.ico) {
          doc.text(`IČO: ${order.company.ico}`, 300);
        }
        
        // DIČ
        if (order.company.dic) {
          doc.text(`DIČ: ${order.company.dic}`, 300);
        }
        
        doc.text(`Typ: Firma / Company`, 300);
        doc.moveDown(0.5);
      }
      // Адреса
      let addressLine = "";
      if (order.customer.street) addressLine += order.customer.street;
      if (order.customer.houseNumber) addressLine += " " + order.customer.houseNumber;
      if (addressLine) doc.text(addressLine, 300);
      
      if (order.customer.city) {
        doc.text(order.customer.city, 300);
      }
      
      if (order.customer.country) {
        doc.text(order.customer.country, 300);
      }

      doc.moveDown(4);

      // -------------------------
      // ТАБЛИЦЯ ТОВАРІВ - ОБРОБКА БОКСІВ
      // -------------------------
      const tableTop = doc.y;
      
      // Заголовки таблиці
      doc.fontSize(9)
        .font('DejaVu-Bold')
        .text("Polozka / Item", 40, tableTop)
        .text("Mnozstvi", 220, tableTop)
        .text("Cena s DPH", 260, tableTop, { width: 60, align: "right" })
        .text("Cena bez DPH", 330, tableTop, { width: 70, align: "right" })
        .text("DPH 21%", 410, tableTop, { width: 60, align: "right" })
        .text("Celkem s DPH", 480, tableTop, { width: 70, align: "right" });

      doc.moveTo(40, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

        let totalWithVAT = 0;
      let currentY = tableTop + 25;
    
    

      // -------------------------
      // ОБРОБКА КОЖНОГО ТОВАРУ
      // -------------------------
      for (const item of order.items) {
        // Якщо це ПОДАРУНКОВИЙ БОКС
        if (item.type === "custom_box" || item.name?.includes("PODARUNKOVY BOX") || item.name?.includes("ПОДАРУНКОВИЙ БОКС")) {
          
          // -------------------------
          // ЗАГОЛОВОК БОКСУ
          // -------------------------
          doc.fontSize(9)
            .font('DejaVu-Bold')
            .text("🎁 PODARUNKOVY BOX / GIFT BOX", 40, currentY, { width: 170 });
          
          currentY += 15;
          
          // Назва боксу
          const boxName = item.name?.replace(/🎁\s*(PODARUNKOVY BOX|ПОДАРУНКОВИЙ БОКС)[:\s]*/i, "").trim() || "Gift Box";
          doc.fontSize(8)
            .font('DejaVu')
            .text(`Nazev / Name: ${boxName}`, 50, currentY, { width: 160 });
          
          currentY += 12;
          
          // Коробка
          if (item.box_details?.box_name) {
            const capacity = item.box_details?.box_capacity ? ` (do ${item.box_details.box_capacity} polozek)` : "";
            doc.text(`Krabice / Box: ${item.box_details.box_name}${capacity}`, 50, currentY, { width: 160 });
            currentY += 12;
          }
          
          // -------------------------
          // ТОВАРИ В БОКСІ
          // -------------------------
          if (item.box_details?.products && item.box_details.products.length > 0) {
            doc.text(`Obsah (${item.box_details.products.length} polozek) / Content:`, 50, currentY, { width: 160 });
            currentY += 12;
            
            let productNumber = 1;
            for (const product of item.box_details.products) {
              const productName = product.product_name || product.name || "Produkt";
              const productQuantity = product.product_quantity || product.quantity || 1;
              const productPrice = product.product_price || product.price || 0;
              
              // Розрахунок ДПГ для товару в боксі
              const priceWithoutVAT = productPrice / (1 + VAT_RATE);
              const vatAmount = productPrice - priceWithoutVAT;
              
              doc.text(`  ${productNumber}. ${productName}`, 60, currentY, { width: 150 });
              doc.fontSize(9)
                .text(`${formatPrice(productPrice)} Kc`, 480, currentY, { width: 70, align: "right" });
              
              currentY += 12;
              
              // Додаємо до загальних сум
              const totalProductWithVAT = productPrice * productQuantity;
              const totalProductWithoutVAT = priceWithoutVAT * productQuantity;
              const totalProductVAT = vatAmount * productQuantity;
              
              totalWithVAT += totalProductWithVAT;
         
              
              productNumber++;
              
              // Перевірка на нову сторінку
              if (currentY > doc.page.height - 100) {
                doc.addPage();
                currentY = 40;
              }
            }
          }
          
          // -------------------------
          // ЛИСТІВКА
          // -------------------------
          if (item.box_details?.card) {
            const cardName = item.box_details.card.card_name || item.box_details.card.name || "Listivka";
            const cardPrice = item.box_details.card.card_price || item.box_details.card.price || 0;
            
            if (cardPrice > 0) {
              // Розрахунок ДПГ для листівки
              const cardWithoutVAT = cardPrice / (1 + VAT_RATE);
              const cardVAT = cardPrice - cardWithoutVAT;
              
              doc.text(`Listivka / Greeting card: ${cardName}`, 50, currentY, { width: 160 });
              doc.fontSize(9)
                .text(`${formatPrice(cardPrice)} Kc`, 480, currentY, { width: 70, align: "right" });
              
              currentY += 12;
              
              // Додаємо до загальних сум
              totalWithVAT += cardPrice;
            
            }
          }
          
          // -------------------------
          // РЯДОК З ЦІНОЮ БОКСУ
          // -------------------------
          currentY += 5;
          
          // Отримуємо ціну коробки по типу
let boxPrice = 0;
const boxNameNew = item.box_details?.box_name || "";

if (boxNameNew.includes("Small") || boxNameNew.includes("Маленька")) {
  boxPrice = 50;
} else if (boxNameNew.includes("Medium") || boxNameNew.includes("Середня")) {
  boxPrice = 70;
} else if (boxNameNew.includes("Big") || boxNameNew.includes("Велика")) {
  boxPrice = 100;
}
totalWithVAT += boxPrice;
          const boxWithoutVAT = boxPrice / (1 + VAT_RATE);
          const boxVAT = boxPrice - boxWithoutVAT;
          
          // Підсумкова вартість боксу
          doc.fontSize(9)
            .font('DejaVu-Bold')
            .text("Hodnota boxu / Box value:", 40, currentY, { width: 170 })
            .text("1", 220, currentY, { width: 30, align: "center" })
            .text(`${formatPrice(boxPrice)} Kc`, 260, currentY, { width: 60, align: "right" })
            .text(`${formatPrice(boxWithoutVAT)} Kc`, 330, currentY, { width: 70, align: "right" })
            .text(`${formatPrice(boxVAT)} Kc`, 410, currentY, { width: 60, align: "right" })
            .text(`${formatPrice(boxPrice)} Kc`, 480, currentY, { width: 70, align: "right" });
          
          currentY += 20;
          
        } else {
          // -------------------------
          // ЗВИЧАЙНИЙ ТОВАР (НЕ БОКС)
          // -------------------------
          const priceWithVAT = item.price || 0;
          const quantity = item.quantity || 1;
          
          // Розрахунок ДПГ
          const priceWithoutVAT = priceWithVAT / (1 + VAT_RATE);
          const vatPerUnit = priceWithVAT - priceWithoutVAT;
          
          // Загальна сума для товару
          const totalItemWithVAT = priceWithVAT * quantity;
          const totalItemWithoutVAT = priceWithoutVAT * quantity;
          const totalItemVAT = vatPerUnit * quantity;
          
          // Додаємо до загальних сум
          totalWithVAT += totalItemWithVAT;
        
          
          // Обрізаємо довгі назви
          const itemName = item.name || "Produkt";
          const displayName = itemName.length > 25 ? itemName.substring(0, 22) + "..." : itemName;
          
          // Вивід рядка товару
          doc.fontSize(9)
            .font('DejaVu')
            .text(displayName, 40, currentY, { width: 170 })
            .text(quantity.toString(), 220, currentY, { width: 30, align: "center" })
            .text(`${formatPrice(priceWithVAT)} Kc`, 260, currentY, { width: 60, align: "right" })
            .text(`${formatPrice(priceWithoutVAT)} Kc`, 330, currentY, { width: 70, align: "right" })
            .text(`${formatPrice(vatPerUnit)} Kc`, 410, currentY, { width: 60, align: "right" })
            .text(`${formatPrice(totalItemWithVAT)} Kc`, 480, currentY, { width: 70, align: "right" });

          currentY += 20;
        }
        
        // Перевірка на нову сторінку
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 40;
        }
      }

      // -------------------------
      // ДОСТАВКА
      // -------------------------
    const deliveryPrice = Number(order.deliveryPrice || 0);
      
      const deliveryType = getDeliveryType(order.delivery);
      
      if (deliveryPrice > 0) {
        const deliveryWithoutVAT = deliveryPrice / (1 + VAT_RATE);
        const deliveryVAT = deliveryPrice - deliveryWithoutVAT;
        
        doc.fontSize(8)
          .font('DejaVu')
          .text(`Doprava / Delivery: ${deliveryType}`, 40, currentY, { width: 170 })
          .text("1", 220, currentY, { width: 30, align: "center" })
          .text(`${formatPrice(deliveryPrice)} Kc`, 260, currentY, { width: 60, align: "right" })
          .text(`${formatPrice(deliveryWithoutVAT)} Kc`, 330, currentY, { width: 70, align: "right" })
          .text(`${formatPrice(deliveryVAT)} Kc`, 410, currentY, { width: 60, align: "right" })
          .text(`${formatPrice(deliveryPrice)} Kc`, 480, currentY, { width: 70, align: "right" });
        
        totalWithVAT += deliveryPrice;
      
        
        currentY += 20;
      }
      
      // -------------------------
      // ДОДАТКОВИЙ ПЛАТІЖ ЗА ДОБІРКУ
      // -------------------------
      const codFee = (order.payment === "cash_on_delivery" || order.payment === "dobírka") ? 50 : 0;
      
      if (codFee > 0) {
        const codWithoutVAT = codFee / (1 + VAT_RATE);
        const codVAT = codFee - codWithoutVAT;
        
        doc.fontSize(8)
          .font('DejaVu')
          .text("Příplatek za dobírku / COD fee", 40, currentY, { width: 170 })
          .text("1", 220, currentY, { width: 30, align: "center" })
          .text(`${formatPrice(codFee)} Kc`, 260, currentY, { width: 60, align: "right" })
          .text(`${formatPrice(codWithoutVAT)} Kc`, 330, currentY, { width: 70, align: "right" })
          .text(`${formatPrice(codVAT)} Kc`, 410, currentY, { width: 60, align: "right" })
          .text(`${formatPrice(codFee)} Kc`, 480, currentY, { width: 70, align: "right" });
        
        totalWithVAT += codFee;
       
        
        currentY += 20;
      }

      // Лінія під таблицею
      doc.moveTo(40, currentY + 5)
        .lineTo(550, currentY + 5)
        .stroke();

      currentY += 15;
// ✅ БУХГАЛТЕРСЬКИЙ РОЗРАХУНОК (від загальної суми)
totalWithVAT = Number(order.total || totalWithVAT); // присвоюємо існуючій змінній
const totalWithoutVAT = +(totalWithVAT / (1 + VAT_RATE)).toFixed(2);
const totalVAT = +(totalWithVAT - totalWithoutVAT).toFixed(2);
      // -------------------------
      // ПІДСУМКИ
      // -------------------------
      const summaryX = 330;
      
      // Загальна сума без ДПГ
      doc.fontSize(9)
        .font('DejaVu')
        .text("Celkem bez DPH / Total without VAT:", summaryX, currentY, { continued: true })
        .text(`${formatPrice(totalWithoutVAT)} Kc`, { align: "right" });
      
      currentY += 15;
      
      // ДПГ
      doc.text("DPH 21% / VAT 21%:", summaryX, currentY, { continued: true })
        .text(`${formatPrice(totalVAT)} Kc`, { align: "right" });
      
      currentY += 15;
      
      // Лінія
      doc.moveTo(summaryX, currentY + 5)
        .lineTo(550, currentY + 5)
        .stroke();
      
      currentY += 15;
      
      // ЗАГАЛЬНА СУМА З ДПГ
      doc.fontSize(11)
        .font('DejaVu-Bold')
        .text("CELKEM S DPH / TOTAL WITH VAT:", summaryX, currentY, { continued: true })
        .text(`${formatPrice(totalWithVAT)} Kc`, { align: "right" });

      // -------------------------
      // ДЕТАЛІ ОПЛАТИ
      // -------------------------
    doc.moveDown(8);
      
      doc.fontSize(10)
        .font('DejaVu-Bold')
        .text("Platebni udaje / Payment details:", 40);
      
      // ВИБІР РЕКВІЗИТІВ В ЗАЛЕЖНОСТІ ВІД СПОСОБУ ОПЛАТИ
      if (order.payment === "bank" || order.payment === "bank_transfer") {
        // БАНКІВСЬКИЙ ПЕРЕКАЗ - показуємо реквізити
        doc.fontSize(9)
          .font('DejaVu')
          .text(`Zpusob platby / Payment method: Bankovni prevod / Bank transfer`, 40)
          .text(`Cislo uctu / Account number: CZ6508000000192000145399`, 40)
          .text(`Banka / Bank: Ceska sporitelna`, 40)
          .text(`Variabilni symbol / Variable symbol: ${order.id}`, 40)
          .text(`Castka / Amount: ${formatPrice(totalWithVAT)} Kc`, 40);
        
        // QR код тільки для банківського переказу
        try {
          const qrText = `SPD*1.0*ACC:CZ6508000000192000145399*AM:${totalWithVAT.toFixed(2)}*CC:CZK*X-VS:${order.id}*MSG:Iva Chocolate Order ${order.id}`;
          const qrCodeDataUrl = await QRCode.toDataURL(qrText, { width: 100 });
          
          const matches = qrCodeDataUrl.match(/^data:image\/png;base64,(.*)$/);
          if (matches && matches.length === 2) {
            const buffer = Buffer.from(matches[1], 'base64');
            doc.image(buffer, 400, doc.y - 100, { width: 80 });
            doc.fontSize(7)
              .text("Scan to pay", 400, doc.y - 15, { width: 80, align: "center" });
          }
        } catch (error) {
          console.log("QR Code failed:", error);
        }
        
      } else if (order.payment === "cash_on_delivery" || order.payment === "dobírka") {
        // НАКЛАДЕНИЙ ПЛАТІЖ - НЕ показуємо реквізити
        doc.fontSize(9)
          .font('DejaVu')
          .text(`Zpusob platby / Payment method: Dobírka / Cash on delivery`, 40)
          .moveDown(0.5)
          .text(`Platba bude provedena při převzetí zásilky na poště.`, 40)
          .text(`Castka k úhradě / Amount to pay: ${formatPrice(totalWithVAT)} Kc`, 40)
          .moveDown(0.5)
          .text(`Payment will be made upon receipt of the shipment at the post office.`, 40);
        
      } else if (order.payment === "card") {
        // ОПЛАТА КАРТКОЮ
        doc.fontSize(9)
          .font('DejaVu')
          .text(`Zpusob platby / Payment method: Platba kartou / Card payment`, 40);
        
        if (order.status === 'paid') {
          doc.text(`Stav platby / Payment status: Zaplaceno / Paid`, 40);
        } else {
          doc.text(`Stav platby / Payment status: Čeká na platbu / Pending`, 40);
        }
      }

      // -------------------------
      // ФУТЕР
      // -------------------------
      doc.moveDown(6);
      doc.fontSize(8)
        .font('DejaVu')
        .text("Dekujeme za vasi objednavku! / Thank you for your order!", { align: "center" })
        .moveDown(0.5)
        .text("V pripade dotazu nas kontaktujte na ivachocolate.store@seznam.cz", { align: "center" })
        .moveDown(0.5)
        .text("Tato faktura byla vygenerovana automaticky.", { align: "center" });

      // Номер сторінки
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7)
          .text(`Strana ${i + 1} z ${pages.count}`, 40, doc.page.height - 40, {
            align: 'center',
            width: doc.page.width - 80
          });
      }

      doc.end();

      stream.on("finish", () => {
        console.log(`✅ PDF з детальним боксом згенеровано: ${filePath}`);
        resolve(filePath);
      });
      stream.on("error", reject);

    } catch (error) {
      console.error("❌ Помилка генерації PDF:", error);
      reject(error);
    }
  });
}

// Допоміжні функції
function getPaymentMethodName(paymentMethod) {
  const methods = {
    'bank': 'Bankovni prevod',
    'bank_transfer': 'Bankovni prevod',
    'card': 'Karta',
    'cash_on_delivery': 'Dobírka',
    'dobírka': 'Dobírka',
    'card_failed': 'Platba kartou (neuspesna)'
  };
  return methods[paymentMethod] || paymentMethod;
}

function getDeliveryType(delivery) {
  if (!delivery) return "Standardni";
  
  if (delivery.includes('Ceska posta') || delivery.includes('Česká pošta')) return "Ceska posta (3-5 dnu)";
  if (delivery.includes('119') || delivery.includes('express')) return "Expresni";
  if (delivery.includes('89') || delivery.includes('standard')) return "Standardni";
  if (delivery.includes('59') || delivery.includes('economy')) return "Ekonomicka";
  if (delivery.includes('free') || delivery.includes('0')) return "Zdarma";
  
  return delivery;
}



function formatPrice(price) {
  const num = typeof price === 'number' ? price : parseFloat(price) || 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
}
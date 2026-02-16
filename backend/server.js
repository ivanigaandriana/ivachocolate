import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { generateInvoice } from './utils/generateInvoice.js';
import { sendOrderEmail } from './utils/email.js';
import { fileURLToPath } from 'url';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// -------------------------
// Сервер
// -------------------------
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Віддаємо всі публічні файли
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24*60*60*1000 } // 1 день
}));
const PORT = process.env.PORT || 3000;


// Мідлвар для авторизації
function authMiddleware(req, res, next) {
  if (req.session.admin) return next();
  res.redirect('/admin/login.html'); // ← тут вказуємо точний шлях
}
// Middleware: секретний ключ
// -------------------------
function secretKeyMiddleware(req, res, next) {
  const secretKey = process.env.ADMIN_SECRET_KEY || 'supersecret123'; // змінюється у .env
  if (req.query.key === secretKey) {
    return next(); // все ок
  } else {
    return res.status(403).send('❌ Доступ заборонено: неправильний секретний ключ');
  }
}

// Використовуємо після login маршруту
app.get('/admin/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});
// 🔥 ВІДДАЄМО PUBLIC
app.post('/admin/login', (req, res) => {
  const { login, password, secretKey } = req.body;

  const correctLogin = process.env.ADMIN_USER;
  const correctPass = process.env.ADMIN_PASS;
  const correctKey  = process.env.ADMIN_SECRET_KEY || 'supersecret123';

  if (login === correctLogin && password === correctPass && secretKey === correctKey) {
    req.session.admin = true;
    return res.json({ success: true }); // ✅ всі три перевірки пройшли
  }

  res.json({ success: false, message: 'Невірний логін, пароль або секретний ключ' });
});
app.use(
  '/admin',
  secretKeyMiddleware,     // перевірка ключа
  authMiddleware,          // перевірка сесії (пароль)
  express.static(path.join(__dirname, 'public', 'admin'))
);
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});
// -------------------------
// Middleware
// -------------------------
app.use(cors());

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.path === '/api/order' && req.method === 'POST') {
    console.log('\n📥 Отримано нове замовлення');
    console.log('Customer name (raw):', req.body.customer?.name);
  }
  next();
});

// -------------------------
// Масив замовлень
// -------------------------
let orders = [];

// -------------------------
// Допоміжні функції
// -------------------------
function escapeHtml(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#039;');
}

// -------------------------
// Функції роботи з файлами
// -------------------------
async function saveOrderToFile(order) {
  try {
    const dir = path.join(process.cwd(), 'data', 'orders');
    await fs.mkdir(dir, { recursive: true });
    const fileName = `order_${order.id}_${Date.now()}.json`;
    await fs.writeFile(path.join(dir, fileName), JSON.stringify(order, null, 2));
    console.log(`💾 Замовлення збережено в ${fileName}`);
    return true;
  } catch (e) {
    console.error('❌ Помилка збереження:', e);
    return false;
  }
}

async function loadOrdersFromFiles() {
  try {
    const dir = path.join(process.cwd(), 'data', 'orders');
    const files = await fs.readdir(dir);
    const loaded = [];
    for (const f of files) {
      if (f.endsWith('.json')) loaded.push(JSON.parse(await fs.readFile(path.join(dir, f), 'utf-8')));
    }
    console.log(`📂 Завантажено ${loaded.length} замовлень`);
    return loaded;
  } catch {
    console.log('⚠️ Не вдалося завантажити замовлення');
    return [];
  }
}

// -------------------------
// Telegram
// -------------------------
async function sendToTelegram(order) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.log('⚠️ Telegram не налаштовано');
      return false;
    }

    // Формуємо повідомлення
    let message = `<b>🎁 НОВЕ ЗАМОВЛЕННЯ #${order.id}</b>\n\n`;
    message += `<b>👤 Клієнт:</b> ${escapeHtml(order.customer?.name || 'Не вказано')}\n`;
    message += `<b>📞 Телефон:</b> ${escapeHtml(order.customer?.phone || 'Не вказано')}\n`;
    
    if (order.customer?.email) {
      message += `<b>📧 Email:</b> ${escapeHtml(order.customer.email)}\n`;
    }
     // 🏢 ДАНІ КОМПАНІЇ (якщо є)
    if (order.company && (order.company.name || order.company.ico || order.company.dic)) {
      message += `\n<b>🏢 ДАНІ КОМПАНІЇ:</b>\n`;
      if (order.company.name) message += `<b>Назва:</b> ${escapeHtml(order.company.name)}\n`;
      if (order.company.ico) message += `<b>IČO:</b> ${escapeHtml(order.company.ico)}\n`;
      if (order.company.dic) message += `<b>DIČ:</b> ${escapeHtml(order.company.dic)}\n`;
      message += `<i>🔄 Замовлення оформлено на компанію</i>\n`;
    }
    
    message += `\n<b>💰 Сума:</b> ${order.total} ${order.currency || 'Kč'}\n`;
    message += `<b>📦 Товарів:</b> ${order.items?.length || 0}\n`;
    
    if (order.items && order.items.length > 0) {
      message += `\n<b>🛒 Замовлення:</b>\n`;
      
      // 1. Спочатку звичайні товари
      const regularItems = order.items.filter(item => item.type !== 'custom_box');
      const boxItems = order.items.filter(item => item.type === 'custom_box');
      
      if (regularItems.length > 0) {
        regularItems.forEach((item, index) => {
          message += `${index + 1}. ${escapeHtml(item.name)}`;
          if (item.quantity > 1) {
            message += ` x${item.quantity}`;
          }
          if (item.price) {
            message += ` - ${item.price * (item.quantity || 1)} ${order.currency || 'Kč'}`;
          }
          message += `\n`;
        });
      }
      
      // 2. Потім бокси з деталями
      if (boxItems.length > 0) {
        boxItems.forEach((box, boxIndex) => {
          const startNumber = regularItems.length + boxIndex + 1;
          
          message += `\n<b>${startNumber}. 🎁 ПОДАРУНКОВИЙ БОКС</b>\n`;
          message += `   <b>Назва:</b> ${escapeHtml(box.name)}\n`;
          
          // Використовуємо box_details (які ми гарантовано маємо після конвертації)
          if (box.box_details) {
            const details = box.box_details;
            
            message += `   <b>Коробка:</b> ${escapeHtml(details.box_name)}`;
            if (details.box_capacity) {
              message += ` (до ${details.box_capacity} товарів)`;
            }
            message += `\n`;
            
            if (details.products && details.products.length > 0) {
              message += `   <b>Вміст (${details.products.length} товарів):</b>\n`;
              details.products.forEach((product, prodIndex) => {
                message += `   ${prodIndex + 1}. ${escapeHtml(product.product_name || product.name || 'Товар')}`;
                if (product.product_quantity > 1 || product.quantity > 1) {
                  message += ` x${product.product_quantity || product.quantity || 1}`;
                }
                if (product.product_price || product.price) {
                  message += ` - ${product.product_price || product.price || 0} ${order.currency || 'Kč'}`;
                }
                message += `\n`;
              });
            }
            
            if (details.card) {
              message += `   <b>Листівка:</b> ${escapeHtml(details.card.card_name || details.card.name || 'Листівка')}`;
              if (details.card.card_price || details.card.price) {
                message += ` - ${details.card.card_price || details.card.price || 0} ${order.currency || 'Kč'}`;
              }
              message += `\n`;
            }
          }
          
          message += `   <b>Вартість боксу:</b> ${box.price || 0} ${order.currency || 'Kč'}\n`;
        });
      }
    }
    
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

if (order.branch)
  message += `Відділення: ${escapeHtml(order.branch)}\n`;
// 💬 КОМЕНТАР
if (order.comment?.trim())
  message += `\n<b>💬 Коментар:</b> ${escapeHtml(order.comment)}\n`;
// Доставка, Оплата, Час
// -------------------------
if (order.delivery) {
    let deliveryText = escapeHtml(order.delivery);
   message += `\n<b>🚚 Доставка:</b> ${escapeHtml(order.delivery)}`; // ✅ показує ціну
    // message += `\n<b>🚚 Доставка:</b> ${deliveryText}`;
}

    if (order.payment) message += `\n<b>💳 Оплата:</b> ${escapeHtml(order.payment)}`;
message += `\n\n⏰ Час: ${new Date(order.createdAt).toLocaleTimeString('uk-UA')}`;

    // Функція для екранування HTML
    function escapeHtml(text) {
      if (!text || typeof text !== 'string') return text || '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Відправляємо повідомлення
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Telegram: Повідомлення відправлено успішно!');
      return true;
    } else {
      console.log('❌ Telegram помилка:', result.description);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Помилка Telegram:', error.message);
    return false;
  }
}
async function sendPlainText(botToken, chatId, order) {
    try {
        let text = `🎁 НОВЕ ЗАМОВЛЕННЯ #${order.id}\n\n`;
        text += `👤 Клієнт: ${order.customer?.name || 'Не вказано'}\n`;
        text += `📞 Телефон: ${order.customer?.phone || 'Не вказано'}\n`;
        
        if (order.customer?.email) {
            text += `📧 Email: ${order.customer.email}\n`;
        }
        
        text += `\n💰 Сума: ${order.total} ${order.currency || 'Kč'}\n`;
        text += `📦 Товарів: ${order.items?.length || 0}\n`;
        
        if (order.items && order.items.length > 0) {
            text += `\n🛒 Замовлення:\n`;
            
            // Звичайні товари
            order.items.forEach(item => {
                if (item.type !== 'custom_box') {
                    text += `• ${item.name}`;
                    if (item.quantity > 1) {
                        text += ` x${item.quantity}`;
                    }
                    text += `\n`;
                }
            });
            
            // Бокси
            order.items.forEach(item => {
                if (item.type === 'custom_box') {
                    text += `\n🎁 ПОДАРУНКОВИЙ БОКС: ${item.name}\n`;
                    
                    if (item.box_details?.products) {
                        text += `Вміст:\n`;
                        item.box_details.products.forEach(product => {
                            text += `  • ${product.product_name}`;
                            if (product.product_quantity > 1) {
                                text += ` x${product.product_quantity}`;
                            }
                            text += `\n`;
                        });
                    } else if (item.details) {
                        text += `Деталі: ${item.details}\n`;
                    }
                }
            });
        }
        
        text += `\n📍 Країна: ${order.customer?.country || 'Не вказано'}`;
        text += `\n🚚 Доставка: ${order.delivery || 'Не вказано'}`;
        text += `\n💳 Оплата: ${order.payment || 'Не вказано'}`;
        text += `\n\n⏰ Час: ${new Date(order.createdAt).toLocaleTimeString('uk-UA')}`;

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text
            })
        });

        const result = await response.json();
        return result.ok;
        
    } catch (error) {
        console.error('❌ Помилка plain text:', error.message);
        return false;
    }
}

// -------------------------
// Маршрути
// -------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html')); // ← ../ піднімаємось на рівень вище
});
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date().toISOString(), uptime: Math.floor(process.uptime()) + ' секунд' }));
app.get('/api/orders', (req, res) => res.json({ success: true, count: orders.length, orders: [...orders].reverse() }));


// -------------------------
// POST /api/order
// -------------------------
app.post('/api/order', async (req, res) => {
  try {
    const order = req.body;

    console.log('\n📥 ========== ОТРИМАНО ЗАМОВЛЕННЯ ==========');
    console.log('Загальна сума:', order.total);
    console.log('Кількість товарів:', order.items?.length);
    
     // ✅ ЛОГУВАННЯ ДАНИХ КОМПАНІЇ
    if (order.company) {
      console.log('🏢 ДАНІ КОМПАНІЇ:');
      console.log('Назва:', order.company.name);
      console.log('IČO:', order.company.ico);
      console.log('DIČ:', order.company.dic);
    } else {
      console.log('👤 Замовлення фізичної особи');
    }
    // Логування вхідних даних
    if (order.items && order.items.length > 0) {
      console.log('\n📋 ВХІДНІ ТОВАРИ:');
      order.items.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.name}`);
        console.log('   Тип:', item.type || 'product');
        console.log('   Ціна:', item.price);
        console.log('   Кількість:', item.quantity || 1);
        console.log('   box_details:', item.box_details ? '✅ Є' : '❌ Немає');
        console.log('   products:', item.products ? '✅ Є' : '❌ Немає');
      });
    }

    // Перевірка обов'язкових полів
    if (!order.customer || !order.items || !Array.isArray(order.items)) {
      return res.status(400).json({ success: false, message: 'Невірний формат замовлення' });
    }

    // ========== КОНВЕРТАЦІЯ ПОДАРУНКОВИХ БОКСІВ ==========
    console.log('\n🔄 Конвертуємо подарункові бокси...');
    
    order.items = order.items.map(item => {
      // Якщо назва містить "ПОДАРУНКОВИЙ БОКС" або це вже custom_box
      if (item.name?.includes("ПОДАРУНКОВИЙ БОКС") || item.type === "custom_box") {
        console.log(`   📦 Конвертуємо: ${item.name}`);
        
        // Створюємо структуру кастомного боксу
        const customBox = {
          type: "custom_box",
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          image: item.image || '/foto/logo2.png',
          isGift: item.isGift || false,
          // Зберігаємо всі оригінальні дані
          ...item
        };
        
        // Якщо немає box_details, створюємо їх
        if (!item.box_details) {
         customBox.box_details = {
    box_name: item.name.replace(/🎁\s*ПОДАРУНКОВИЙ БОКС:\s*/i, "").trim() || "Коробка",
    box_capacity: item.box?.capacity || 3,
    box_price: item.box?.price || 0, // ← ОСЬ ЦІНА КОРОБКИ
    box_image: item.image || '/foto/logo2.png',
    products: item.products || [],
    card: item.card || null,
    total_items: (item.products || []).reduce((sum, p) => sum + (p.quantity || 1), 0),
    created_at: new Date().toISOString()
  };
          
          console.log(`   ✅ Створено box_details для: ${item.name}`);
          console.log(`     Продуктів: ${customBox.box_details.products.length}`);
        } else {
          console.log(`   ✅ Вже є box_details у: ${item.name}`);
        }
        
        return customBox;
      }
      
      // Звичайні товари залишаються як є
      return item;
    });

    console.log('\n✅ ПІСЛЯ КОНВЕРТАЦІЇ:');
    order.items.forEach((item, index) => {
      if (item.type === 'custom_box') {
        console.log(`   ${index + 1}. ${item.name}`);
        console.log('     Тип:', item.type);
        console.log('     box_details:', item.box_details ? '✅ Є' : '❌ Немає');
      }
    });

    const newOrder = {
      id: Date.now(),
      ...order,
      status: 'new',
      createdAt: new Date().toISOString()
    };
  // ✅ ЗАЛИШАЄМО ДАНІ КОМПАНІЇ В newOrder
    if (order.company) {
      newOrder.company = order.company;
    }
    // Зберігаємо в пам'яті
    orders.push(newOrder);

    // Зберігаємо у файл
    await saveOrderToFile(newOrder);
    
    // ========= PDF =========
console.log('📄 Генеруємо invoice PDF...');
const invoicePath = await generateInvoice(newOrder);

// ========= Telegram =========
console.log('\n📱 Надсилаємо сповіщення в Telegram...');
const telegramSent = await sendToTelegram(newOrder);

// ========= Email =========
console.log('📧 Надсилаємо email клієнту...');
const emailResult = await sendOrderEmail(newOrder, invoicePath);
    
    if (telegramSent) {
      console.log('✅ Telegram успішно відправлено!');
    } else {
      console.log('⚠️ Telegram не відправлено');
    }

    console.log('\n📦 НОВЕ ЗАМОВЛЕННЯ ПРИЙНЯТО:', {
      id: newOrder.id,
      customer: newOrder.customer.name,
       company: newOrder.company ? `(${newOrder.company.name})` : 'фізична особа',
      total: newOrder.total + ' ' + newOrder.currency,
      items: newOrder.items.length
    });

    res.json({
      success: true,
      message: 'Замовлення прийнято!',
      orderId: newOrder.id
    });
  } catch (error) {
    console.error('❌ ПОМИЛКА:', error);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});


// -------------------------
// Старт сервера
// -------------------------
(async () => {
  orders = await loadOrdersFromFiles();
  app.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));
})();
// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  const order = orders.find(o => o.id === id);
  if(!order) return res.status(404).json({ success: false, message: "Замовлення не знайдено" });

  order.status = status;

  // Оновлюємо файл
  try {
    const dir = path.join(process.cwd(), 'data', 'orders');
    const files = await fs.readdir(dir);
    for(const file of files){
      if(file.includes(String(id))){
        await fs.writeFile(path.join(dir, file), JSON.stringify(order, null, 2));
        break;
      }
    }
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Помилка оновлення файлу:', e);
    res.status(500).json({ success: false, message: 'Помилка оновлення файлу' });
  }
});

// DELETE /api/orders/:id
app.delete('/api/orders/:id', async (req, res) => {
  const id = Number(req.params.id);
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: "Замовлення не знайдено" });

  // Видаляємо із пам'яті
  const [deleted] = orders.splice(index, 1);

  // Видаляємо файл
  try {
    const dir = path.join(process.cwd(), 'data', 'orders');
    const files = await fs.readdir(dir);
    for(const file of files){
      if(file.includes(String(id))){
        await fs.unlink(path.join(dir, file));
        break;
      }
    }
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Помилка видалення файлу:', e);
    res.status(500).json({ success: false, message: 'Помилка видалення файлу' });
  }
});
import 'dotenv/config';

console.log('=== Перевірка змінних середовища ===');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID);
console.log('Тип Chat ID:', typeof process.env.TELEGRAM_CHAT_ID);
console.log('Чи є лапки?', process.env.TELEGRAM_CHAT_ID?.includes('"') ? '✅ ТАК' : '❌ НІ');

// Перетворення в число для перевірки
const chatId = parseInt(process.env.TELEGRAM_CHAT_ID);
console.log('Chat ID як число:', chatId);
console.log('Чи коректне число?', !isNaN(chatId) ? '✅ ТАК' : '❌ НІ');

import 'dotenv/config';

const BOT_TOKEN = '7967120388:AAHCVIM2qdzFxD2QvtIFXPTJjeMMVVVON-U';

async function diagnose() {
  console.log('🔍 Діагностика Telegram бота\n');
  console.log('Токен:', BOT_TOKEN);
  console.log('Довжина токена:', BOT_TOKEN.length);
  console.log('Формат:', /^\d+:[\w-]{35}$/.test(BOT_TOKEN) ? '✅ Вірний' : '❌ Невірний');
  
  console.log('\n1. Тестуємо підключення до getMe...');
  try {
    const getMeUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getMe`;
    console.log('URL:', getMeUrl);
    
    const response = await fetch(getMeUrl);
    const data = await response.json();
    
    console.log('Статус:', response.status);
    console.log('Відповідь:', JSON.stringify(data, null, 2));
    
    if (data.ok) {
      console.log('✅ Бот активний!');
      console.log('Username:', data.result.username);
      console.log('Ім\'я:', data.result.first_name);
      
      // Тепер отримуємо updates
      console.log('\n2. Отримуємо оновлення для Chat ID...');
      const updatesUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`;
      const updatesResponse = await fetch(updatesUrl);
      const updatesData = await updatesResponse.json();
      
      if (updatesData.ok) {
        console.log('Знайдено оновлень:', updatesData.result.length);
        
        if (updatesData.result.length > 0) {
          console.log('\n📋 Знайдені чати:');
          updatesData.result.forEach((update, index) => {
            if (update.message) {
              console.log(`\n${index + 1}. Chat ID: ${update.message.chat.id}`);
              console.log(`   Ім'я: ${update.message.chat.first_name || 'Невідомо'}`);
              console.log(`   Username: ${update.message.chat.username || 'Немає'}`);
              console.log(`   Текст: "${update.message.text || 'Немає тексту'}"`);
            }
          });
        } else {
          console.log('\n⚠️ Оновлень не знайдено.');
          console.log('\nІнструкція:');
          console.log('1. Знайдіть свого бота в Telegram за посиланням:');
          console.log(`   https://t.me/${data.result.username}`);
          console.log('2. Натисніть START / Старт');
          console.log('3. Надішліть будь-яке повідомлення (наприклад "test")');
          console.log('4. Запустіть цей скрипт знову');
        }
      }
      
    } else {
      console.log('❌ Помилка:', data.description);
      console.log('\nМожливі причини:');
      console.log('1. Токен недійсний');
      console.log('2. Бот був видалений');
      console.log('3. Токен неправильно скопійований (перевірте пробіли)');
    }
    
  } catch (error) {
    console.log('❌ Помилка мережі:', error.message);
    console.log('\nПеревірте:');
    console.log('1. Інтернет-підключення');
    console.log('2. Доступ до api.telegram.org');
  }
}

diagnose();
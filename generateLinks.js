// generateLinks.js

const fs = require('fs');
const path = require('path');

// Вкажіть шлях до вашого JSON-файлу
const filePath = path.join(__dirname, 'data', 'product.json');

// Зчитування файлу
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.log('Помилка при читанні файлу:', err);
    return;
  }
  
  // Парсинг JSON-даних
  const products = JSON.parse(data);

  // Перегляд всіх продуктів і їх лінків
  for (const category in products) {
    if (products.hasOwnProperty(category)) {
      products[category].forEach(product => {
        console.log(`Продукт: ${product.name}, Лінк: ${product.link}`);
      });
    }
  }
});
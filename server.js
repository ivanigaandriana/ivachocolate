const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 3000;  // Можна змінити порт

// Мідлвари
app.use(cors());
app.use(bodyParser.json());

// Підключення до MongoDB
mongoose.connect('mongodb://localhost:27017/chocolateLand', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.log('Error connecting to MongoDB', err);
});

// Простий маршрут
app.get('/', (req, res) => {
  res.send('Welcome to ChocolateLand!');
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
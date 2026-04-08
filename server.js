const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const orderRoutes = require('./routes/orderRoutes');
const initDb = require('./config/initDb');

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

app.get('/qr-a4', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'qr-a4.html'));
});

const PORT = process.env.PORT || 5000;

initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database init failed:', err.message);
    process.exit(1);
  });
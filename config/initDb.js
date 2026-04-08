const db = require('./db');

async function initDb() {
  // ⚠️ Set this true ONLY for testing
  const RESET_DB = true;

  if (RESET_DB) {
    console.log('⚠️ Resetting database...');

    await db.query(`SET FOREIGN_KEY_CHECKS = 0`);

    await db.query(`DROP TABLE IF EXISTS customer_order_items`);
    await db.query(`DROP TABLE IF EXISTS customer_orders`);
    await db.query(`DROP TABLE IF EXISTS menu_items`);

    await db.query(`SET FOREIGN_KEY_CHECKS = 1`);
  }

  // =========================
  // CREATE TABLES
  // =========================

  await db.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      category VARCHAR(100) DEFAULT 'Thali',
      is_available TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      table_id VARCHAR(50) NOT NULL,
      order_code VARCHAR(100) NOT NULL,
      status ENUM('pending','accepted','in_billing','completed','cancelled') DEFAULT 'pending',
      source VARCHAR(50) DEFAULT 'qr',
      imported_to_pos TINYINT(1) NOT NULL DEFAULT 0,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      customer_name VARCHAR(255) DEFAULT '',
      customer_phone VARCHAR(50) DEFAULT '',
      customer_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      item_name VARCHAR(255) NOT NULL,
      qty INT NOT NULL DEFAULT 1,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE
    )
  `);

  // =========================
  // INSERT DEFAULT DATA
  // =========================

  console.log('📦 Inserting menu data...');

  await db.query(`
INSERT INTO menu_items (name, price, category, is_available)
VALUES

-- 🥘 THALI (from page 2 & 3)
('Special Veg Thali', 220.00, 'Thali', 1),
('Regular Plate (Limited)', 140.00, 'Thali', 1),
('Maharashtrian Thali', 220.00, 'Thali', 1),
('Punjabi Thali', 200.00, 'Thali', 1),
('Chicken Thali', 189.00, 'Thali', 1),
('Mutton Thali', 260.00, 'Thali', 1),
('Egg Thali', 180.00, 'Thali', 1),
('Fish Thali', 300.00, 'Thali', 1),

-- 🍛 VEG MAIN COURSE (page 7)
('Paneer Masala', 180.00, 'Curry', 1),
('Matar Paneer', 180.00, 'Curry', 1),
('Paneer Butter Masala', 180.00, 'Curry', 1),
('Kadai Paneer', 180.00, 'Curry', 1),
('Paneer Lababdar', 200.00, 'Curry', 1),
('Kaju Paneer', 240.00, 'Curry', 1),
('Chana Masala', 160.00, 'Curry', 1),
('Mix Veg Curry', 160.00, 'Curry', 1),
('Aloo Gobi', 280.00, 'Curry', 1),
('Aloo Mutter', 160.00, 'Curry', 1),
('Sev Bhaji', 140.00, 'Curry', 1),
('Zunka Bhakar Special', 140.00, 'Curry', 1),
('Shevga Masala', 200.00, 'Curry', 1),
('Pithla', 120.00, 'Curry', 1),
('Bharli Vangi', 180.00, 'Curry', 1),

-- 🍗 NON VEG MAIN COURSE (page 8)
('Chicken Kala Masala', 180.00, 'Non Veg', 1),
('Chicken Masala', 180.00, 'Non Veg', 1),
('Kadai Chicken', 180.00, 'Non Veg', 1),
('Chicken Tikka Masala', 200.00, 'Non Veg', 1),
('Butter Chicken', 220.00, 'Non Veg', 1),
('Tandoori Chicken Masala', 220.00, 'Non Veg', 1),
('Mutton Kala Masala', 260.00, 'Non Veg', 1),
('Mutton Masala', 260.00, 'Non Veg', 1),
('Mutton Fry', 260.00, 'Non Veg', 1),
('Fish Curry', 220.00, 'Non Veg', 1),
('Pomfret Curry', 280.00, 'Non Veg', 1),
('Prawns Curry', 280.00, 'Non Veg', 1),
('Egg Curry', 140.00, 'Non Veg', 1),

-- 🍚 RICE / BIRYANI (page 4)
('Veg Biryani', 140.00, 'Rice', 1),
('Chicken Biryani', 160.00, 'Rice', 1),
('Mutton Biryani', 240.00, 'Rice', 1),
('Fish Biryani', 220.00, 'Rice', 1),
('Prawns Biryani', 250.00, 'Rice', 1),
('Egg Biryani', 140.00, 'Rice', 1),
('Jeera Rice', 90.00, 'Rice', 1),

-- 🍞 BHAKRI / ROTI (page 9)
('Jowar Bhakri', 25.00, 'Roti', 1),
('Bajra Bhakri', 25.00, 'Roti', 1),
('Rice Bhakri', 25.00, 'Roti', 1),
('Nachni Bhakri', 30.00, 'Roti', 1),
('Chapati', 15.00, 'Roti', 1),
('Tawa Paratha', 20.00, 'Roti', 1),

-- 🍢 STARTERS VEG (page 5)
('Paneer Tikka', 180.00, 'Starter', 1),
('Paneer Chilli', 140.00, 'Starter', 1),
('Paneer Crispy', 180.00, 'Starter', 1),
('Soyabean Crispy', 120.00, 'Starter', 1),

-- 🍗 STARTERS NON VEG (page 6)
('Chicken Tikka', 180.00, 'Starter', 1),
('Tandoori Chicken', 220.00, 'Starter', 1),
('Chicken Seekh Kabab', 220.00, 'Starter', 1),
('Chicken Sukka', 180.00, 'Starter', 1),
('Chicken Fry', 200.00, 'Starter', 1),
('Chicken 65', 200.00, 'Starter', 1),
('Fish Fry', 200.00, 'Starter', 1),
('Prawns Fry', 280.00, 'Starter', 1),

-- 🍨 DESSERT (page 9)
('Gulab Jamun (2 pcs)', 60.00, 'Dessert', 1),
('Kheer', 100.00, 'Dessert', 1),

-- 🥤 EXTRA
('Masala Papad', 80.00, 'Extra', 1),
('Roasted Papad', 60.00, 'Extra', 1),
('Fried Papad', 60.00, 'Extra', 1)
`);

  console.log('✅ Database ready with fresh data');
}

module.exports = initDb;
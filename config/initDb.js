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

    -- 🥘 THALI
    ('Veg Thali', 120.00, 'Thali', 1),
    ('Special Thali', 150.00, 'Thali', 1),
    ('Paneer Thali', 180.00, 'Thali', 1),
    ('Chicken Thali', 220.00, 'Thali', 1),

    -- 🍛 CURRY
    ('Paneer Butter Masala', 160.00, 'Curry', 1),
    ('Kadai Paneer', 170.00, 'Curry', 1),
    ('Mix Veg', 140.00, 'Curry', 1),
    ('Dal Tadka', 120.00, 'Curry', 1),
    ('Chicken Masala', 200.00, 'Curry', 1),

    -- 🍞 ROTI
    ('Chapati', 15.00, 'Roti', 1),
    ('Butter Roti', 20.00, 'Roti', 1),
    ('Naan', 30.00, 'Roti', 1),
    ('Butter Naan', 40.00, 'Roti', 1),

    -- 🍚 RICE
    ('Plain Rice', 80.00, 'Rice', 1),
    ('Jeera Rice', 100.00, 'Rice', 1),
    ('Veg Biryani', 140.00, 'Rice', 1),
    ('Chicken Biryani', 180.00, 'Rice', 1),

    -- 🥤 DRINKS
    ('Water Bottle', 20.00, 'Drinks', 1),
    ('Cold Drink', 40.00, 'Drinks', 1),
    ('Buttermilk', 30.00, 'Drinks', 1),
    ('Lassi', 50.00, 'Drinks', 1),

    -- 🍨 DESSERT
    ('Gulab Jamun', 60.00, 'Dessert', 1),
    ('Ice Cream', 80.00, 'Dessert', 1)
  `);

  console.log('✅ Database ready with fresh data');
}

module.exports = initDb;
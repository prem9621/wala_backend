require('dotenv').config();
const mysql = require('mysql2');

const requiredEnv = [
  'MYSQLHOST',
  'MYSQLPORT',
  'MYSQLUSER',
  'MYSQLPASSWORD',
  'MYSQLDATABASE',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL Connection Error');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
  } else {
    console.log('✅ MySQL Connected Successfully');
    connection.release();
  }
});

module.exports = pool.promise();
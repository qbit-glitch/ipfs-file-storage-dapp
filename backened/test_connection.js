// test-db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: false } : false
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connection successful!');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('Current database time:', result.rows[0].now);
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

testConnection();
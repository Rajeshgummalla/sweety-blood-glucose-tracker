const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initDb() {
  console.log('Initializing Sweety database tables...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../models/schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('Database tables initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
    process.exit(1);
  }
}

initDb();

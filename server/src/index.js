const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL successfully.');

    app.listen(PORT, () => {
      console.log(`Sweety API server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server due to database connection error:', err);
    process.exit(1);
  }
}

startServer();

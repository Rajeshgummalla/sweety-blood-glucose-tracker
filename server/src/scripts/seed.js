const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { formatDate } = require('../utils/dateHelpers');

async function seed() {
  console.log('Seeding Sweety demo data...');
  try {
    // 1. Ensure schema exists
    const schemaSql = fs.readFileSync(path.join(__dirname, '../models/schema.sql'), 'utf-8');
    await pool.query(schemaSql);

    // 2. Demo User credentials
    const demoEmail = 'demo@sweety.app';
    const demoPassword = 'password123';
    const demoName = 'Sarah Jenkins';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(demoPassword, salt);

    // Upsert demo user
    let userResult = await pool.query('SELECT id FROM users WHERE email = $1', [demoEmail]);
    let userId;
    if (userResult.rows.length === 0) {
      const insertUser = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [demoName, demoEmail, passwordHash]
      );
      userId = insertUser.rows[0].id;
      console.log(`Created demo user (ID: ${userId}) with email: ${demoEmail}`);
    } else {
      userId = userResult.rows[0].id;
      console.log(`Demo user already exists (ID: ${userId}) with email: ${demoEmail}`);
      // Clear old readings for demo user for a clean reproducible seed
      await pool.query('DELETE FROM readings WHERE user_id = $1', [userId]);
    }

    // 3. Generate sample readings
    // Current date reference
    const now = new Date();
    const readings = [];

    // Helper to generate a realistic glucose reading based on slot
    function sampleValue(slot) {
      if (slot === 'Morning (fasting)') {
        // Fasting range: typically 85 - 115 mg/dl
        return Math.floor(85 + Math.random() * 30);
      } else if (slot === 'After breakfast') {
        // Post-breakfast: 120 - 155 mg/dl
        return Math.floor(120 + Math.random() * 35);
      } else if (slot === 'After lunch') {
        // Post-lunch: 125 - 165 mg/dl
        return Math.floor(125 + Math.random() * 40);
      } else {
        // After dinner: 120 - 160 mg/dl
        return Math.floor(120 + Math.random() * 40);
      }
    }

    const slots = [
      'Morning (fasting)',
      'After breakfast',
      'After lunch',
      'After dinner',
    ];

    // Generate readings for the past 45 days up to today
    for (let daysAgo = 45; daysAgo >= 0; daysAgo--) {
      const d = new Date(now);
      d.setDate(now.getDate() - daysAgo);
      const dateStr = formatDate(d);

      if (daysAgo === 0) {
        // For today: insert 3 slots, leave 'After dinner' open so user can test adding it!
        readings.push({ date: dateStr, slot: slots[0], value: sampleValue(slots[0]) });
        readings.push({ date: dateStr, slot: slots[1], value: sampleValue(slots[1]) });
        readings.push({ date: dateStr, slot: slots[2], value: sampleValue(slots[2]) });
      } else {
        // Randomly 3 or 4 readings per past day
        const numSlots = Math.random() > 0.2 ? 4 : 3;
        for (let s = 0; s < numSlots; s++) {
          readings.push({
            date: dateStr,
            slot: slots[s],
            value: sampleValue(slots[s]),
          });
        }
      }
    }

    // Insert all sample readings
    for (const r of readings) {
      await pool.query(
        'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
        [userId, r.date, r.slot, r.value]
      );
    }

    console.log(`Successfully seeded ${readings.length} readings for ${demoEmail}!`);
    console.log('\n--- DEMO LOGIN DETAILS ---');
    console.log(`Email:    ${demoEmail}`);
    console.log(`Password: ${demoPassword}`);
    console.log('--------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();

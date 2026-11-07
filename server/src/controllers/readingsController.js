const db = require('../config/db');
const { isValidDateString, isFutureDate } = require('../utils/dateHelpers');

const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

function getArticle(slot) {
  return /^[aeiou]/i.test(slot) ? 'an' : 'a';
}

/**
 * Validates reading inputs according to assignment rules
 */
function validateReadingPayload({ date, slot, value }) {
  // 1. Date validation
  if (!date || !isValidDateString(date)) {
    return { error: 'Please provide a valid date in YYYY-MM-DD format.' };
  }
  if (isFutureDate(date)) {
    return { error: 'Date cannot be in the future.' };
  }

  // 2. Slot validation
  if (!slot || !ALLOWED_SLOTS.includes(slot)) {
    return {
      error: `Invalid slot. Must be one of: ${ALLOWED_SLOTS.join(', ')}.`,
    };
  }

  // 3. Value validation
  if (value === undefined || value === null || value === '') {
    return { error: 'Please enter a glucose value.' };
  }

  const num = Number(value);
  if (!Number.isInteger(num) || num < 40 || num > 600) {
    return { error: 'Value must be between 40 and 600 mg/dl.' };
  }

  return { validValue: num };
}

// Custom sort order for slots
const slotOrderSql = `
  CASE slot
    WHEN 'Morning (fasting)' THEN 1
    WHEN 'After breakfast' THEN 2
    WHEN 'After lunch' THEN 3
    WHEN 'After dinner' THEN 4
    ELSE 5
  END
`;

/**
 * GET /api/readings
 * Supports pagination ?page=1&limit=20 and filtering by date / range
 */
exports.getReadings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, startDate, endDate, page, limit } = req.query;

    const conditions = ['user_id = $1'];
    const params = [userId];

    if (date) {
      params.push(date);
      conditions.push(`reading_date = $${params.length}`);
    } else {
      if (startDate) {
        params.push(startDate);
        conditions.push(`reading_date >= $${params.length}`);
      }
      if (endDate) {
        params.push(endDate);
        conditions.push(`reading_date <= $${params.length}`);
      }
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Total count for pagination
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM readings ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    let queryText = `
      SELECT 
        id, 
        user_id, 
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, 
        slot, 
        value, 
        created_at, 
        updated_at
      FROM readings
      ${whereClause}
      ORDER BY reading_date DESC, ${slotOrderSql} ASC
    `;

    // Pagination
    let currentPage = null;
    let currentLimit = null;
    let totalPages = 1;

    if (page || limit) {
      currentPage = Math.max(1, parseInt(page, 10) || 1);
      currentLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const offset = (currentPage - 1) * currentLimit;
      totalPages = Math.ceil(total / currentLimit) || 1;

      params.push(currentLimit);
      queryText += ` LIMIT $${params.length}`;
      params.push(offset);
      queryText += ` OFFSET $${params.length}`;
    }

    const result = await db.query(queryText, params);

    return res.status(200).json({
      readings: result.rows,
      pagination: {
        total,
        page: currentPage || 1,
        limit: currentLimit || total,
        totalPages,
      },
    });
  } catch (err) {
    console.error('getReadings error:', err);
    return res.status(500).json({ error: 'Failed to fetch readings.' });
  }
};

/**
 * GET /api/readings/:id
 */
exports.getReadingById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        id, 
        user_id, 
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, 
        slot, 
        value, 
        created_at, 
        updated_at
       FROM readings 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    return res.status(200).json({ reading: result.rows[0] });
  } catch (err) {
    console.error('getReadingById error:', err);
    return res.status(500).json({ error: 'Failed to fetch reading.' });
  }
};

/**
 * POST /api/readings
 */
exports.createReading = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, slot, value } = req.body;

    // Field validations
    const validation = validateReadingPayload({ date, slot, value });
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const numValue = validation.validValue;

    // Rule: Maximum 4 readings per day
    const countRes = await db.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
      [userId, date]
    );
    if (countRes.rows[0].count >= 4) {
      return res.status(400).json({ error: 'You can add only 4 readings per day.' });
    }

    // Rule: Only one reading per slot per day
    const existingSlot = await db.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3',
      [userId, date, slot]
    );
    if (existingSlot.rows.length > 0) {
      return res.status(400).json({
        error: `You already have ${getArticle(slot)} ${slot} reading for this date.`,
      });
    }

    const insertRes = await db.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at, updated_at`,
      [userId, date, slot, numValue]
    );

    return res.status(201).json({
      message: 'Reading added successfully.',
      reading: insertRes.rows[0],
    });
  } catch (err) {
    console.error('createReading error:', err);
    // In case of race conditions hitting DB unique constraint
    if (err.code === '23505') {
      const slot = req.body.slot || 'slot';
      return res.status(400).json({
        error: `You already have ${getArticle(slot)} ${slot} reading for this date.`,
      });
    }
    return res.status(500).json({ error: 'Failed to add reading.' });
  }
};

/**
 * PUT /api/readings/:id
 */
exports.updateReading = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date, slot, value } = req.body;

    // Check reading exists and belongs to user
    const existing = await db.query(
      "SELECT id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value FROM readings WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    const current = existing.rows[0];
    const targetDate = date || current.reading_date;
    const targetSlot = slot || current.slot;
    const targetValue = value !== undefined ? value : current.value;

    const validation = validateReadingPayload({
      date: targetDate,
      slot: targetSlot,
      value: targetValue,
    });
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }
    const numValue = validation.validValue;

    // If date changed, check max 4 readings on the new date
    if (targetDate !== current.reading_date) {
      const countRes = await db.query(
        'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
        [userId, targetDate]
      );
      if (countRes.rows[0].count >= 4) {
        return res.status(400).json({ error: 'You can add only 4 readings per day.' });
      }
    }

    // Check slot collision on target date (excluding current reading id)
    const slotCollision = await db.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3 AND id != $4',
      [userId, targetDate, targetSlot, id]
    );
    if (slotCollision.rows.length > 0) {
      return res.status(400).json({
        error: `You already have ${getArticle(targetSlot)} ${targetSlot} reading for this date.`,
      });
    }

    const updateRes = await db.query(
      `UPDATE readings 
       SET reading_date = $1, slot = $2, value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value, created_at, updated_at`,
      [targetDate, targetSlot, numValue, id, userId]
    );

    return res.status(200).json({
      message: 'Reading updated successfully.',
      reading: updateRes.rows[0],
    });
  } catch (err) {
    console.error('updateReading error:', err);
    return res.status(500).json({ error: 'Failed to update reading.' });
  }
};

/**
 * DELETE /api/readings/:id
 */
exports.deleteReading = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    return res.status(200).json({ message: 'Reading deleted successfully.', id });
  } catch (err) {
    console.error('deleteReading error:', err);
    return res.status(500).json({ error: 'Failed to delete reading.' });
  }
};

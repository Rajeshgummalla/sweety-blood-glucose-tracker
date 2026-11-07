const db = require('../config/db');
const {
  getTodayString,
  isValidDateString,
  getMonthToDateRange,
  getPreviousMonthRange,
} = require('../utils/dateHelpers');

/**
 * Computes statistics (highest, lowest, average, count) for a given date range
 */
async function getStatsForRange(userId, startDate, endDate, includeReadings = false) {
  const query = `
    SELECT 
      COUNT(*)::int AS count,
      MAX(value)::int AS highest,
      MIN(value)::int AS lowest,
      ROUND(AVG(value)::numeric, 1)::float AS average
    FROM readings
    WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
  `;
  const statsRes = await db.query(query, [userId, startDate, endDate]);
  const stats = statsRes.rows[0];

  let readings = [];
  if (includeReadings) {
    const readingsRes = await db.query(
      `SELECT 
        id, 
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, 
        slot, 
        value,
        created_at
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       ORDER BY reading_date ASC, 
         CASE slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [userId, startDate, endDate]
    );
    readings = readingsRes.rows;
  }

  return {
    dateRange: { start: startDate, end: endDate },
    count: stats.count,
    highest: stats.count > 0 ? stats.highest : null,
    lowest: stats.count > 0 ? stats.lowest : null,
    average: stats.count > 0 ? stats.average : null,
    ...(includeReadings && { readings }),
  };
}

/**
 * GET /api/reports
 * Returns Daily, Month-to-date, and Monthly (previous month) reports for selected date
 */
exports.getAllReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayString();

    if (!isValidDateString(selectedDate)) {
      return res.status(400).json({ error: 'Please provide a valid date in YYYY-MM-DD format.' });
    }

    const mtdRange = getMonthToDateRange(selectedDate);
    const prevMonthRange = getPreviousMonthRange(selectedDate);

    // 1. Daily Report: The selected date (includes each reading with its slot)
    const daily = await getStatsForRange(userId, selectedDate, selectedDate, true);

    // 2. Month-to-date: 1st of the month to the selected date (includes readings for charts)
    const monthToDate = await getStatsForRange(userId, mtdRange.start, mtdRange.end, true);

    // 3. Monthly: The whole previous month (includes readings for charts)
    const monthly = await getStatsForRange(userId, prevMonthRange.start, prevMonthRange.end, true);

    return res.status(200).json({
      selectedDate,
      daily,
      monthToDate,
      monthly,
    });
  } catch (err) {
    console.error('getAllReports error:', err);
    return res.status(500).json({ error: 'Failed to generate reports.' });
  }
};

/**
 * GET /api/reports/daily?date=YYYY-MM-DD
 */
exports.getDailyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayString();

    if (!isValidDateString(selectedDate)) {
      return res.status(400).json({ error: 'Please provide a valid date in YYYY-MM-DD format.' });
    }

    const report = await getStatsForRange(userId, selectedDate, selectedDate, true);
    return res.status(200).json({ selectedDate, report });
  } catch (err) {
    console.error('getDailyReport error:', err);
    return res.status(500).json({ error: 'Failed to generate daily report.' });
  }
};

/**
 * GET /api/reports/month-to-date?date=YYYY-MM-DD
 */
exports.getMonthToDateReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayString();

    if (!isValidDateString(selectedDate)) {
      return res.status(400).json({ error: 'Please provide a valid date in YYYY-MM-DD format.' });
    }

    const mtdRange = getMonthToDateRange(selectedDate);
    const report = await getStatsForRange(userId, mtdRange.start, mtdRange.end, true);
    return res.status(200).json({ selectedDate, report });
  } catch (err) {
    console.error('getMonthToDateReport error:', err);
    return res.status(500).json({ error: 'Failed to generate month-to-date report.' });
  }
};

/**
 * GET /api/reports/monthly?date=YYYY-MM-DD
 */
exports.getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayString();

    if (!isValidDateString(selectedDate)) {
      return res.status(400).json({ error: 'Please provide a valid date in YYYY-MM-DD format.' });
    }

    const prevMonthRange = getPreviousMonthRange(selectedDate);
    const report = await getStatsForRange(userId, prevMonthRange.start, prevMonthRange.end, true);
    return res.status(200).json({ selectedDate, report });
  } catch (err) {
    console.error('getMonthlyReport error:', err);
    return res.status(500).json({ error: 'Failed to generate monthly report.' });
  }
};

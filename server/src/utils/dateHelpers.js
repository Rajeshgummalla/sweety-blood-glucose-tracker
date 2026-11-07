/**
 * Formats a Date object as YYYY-MM-DD
 */
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date string (YYYY-MM-DD) based on server local time
 */
function getTodayString() {
  return formatDate(new Date());
}

/**
 * Validates whether date string is YYYY-MM-DD
 */
function isValidDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

/**
 * Checks if a given YYYY-MM-DD is strictly after today
 */
function isFutureDate(dateStr) {
  const todayStr = getTodayString();
  return dateStr > todayStr;
}

/**
 * Returns Month-to-date range:
 * 1st of the month of selected date up to the selected date itself
 * e.g., for '2026-10-15' -> { start: '2026-10-01', end: '2026-10-15' }
 */
function getMonthToDateRange(dateStr) {
  const [year, month] = dateStr.split('-');
  const start = `${year}-${month}-01`;
  return { start, end: dateStr };
}

/**
 * Returns the whole previous month range:
 * e.g., for '2026-10-15' -> { start: '2026-09-01', end: '2026-09-30' }
 * For '2026-01-05' -> { start: '2025-12-01', end: '2025-12-31' }
 */
function getPreviousMonthRange(dateStr) {
  const [year, month] = dateStr.split('-').map(Number);
  // Month is 1-indexed (1 = Jan, 10 = Oct)
  // Day 0 of the current month gives the last day of the previous month!
  const lastDayPrevMonth = new Date(year, month - 1, 0);
  const prevYear = lastDayPrevMonth.getFullYear();
  const prevMonth = String(lastDayPrevMonth.getMonth() + 1).padStart(2, '0');
  const endDay = String(lastDayPrevMonth.getDate()).padStart(2, '0');

  const start = `${prevYear}-${prevMonth}-01`;
  const end = `${prevYear}-${prevMonth}-${endDay}`;
  return { start, end };
}

module.exports = {
  formatDate,
  getTodayString,
  isValidDateString,
  isFutureDate,
  getMonthToDateRange,
  getPreviousMonthRange,
};

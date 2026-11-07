/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatToDateInput(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD to human friendly string: e.g. "15 Oct 2026"
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a date range string: e.g. "1 Oct – 15 Oct 2026" or "1 Sep – 30 Sep 2026"
 */
export function formatDateRange(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return '';
  const [sY, sM, sD] = startDateStr.split('-').map(Number);
  const [eY, eM, eD] = endDateStr.split('-').map(Number);
  const start = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endYear = end.getFullYear();

  if (sM === eM && sY === eY) {
    return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${endYear}`;
  }
  return `${start.getDate()} ${startMonth} ${start.getFullYear()} – ${end.getDate()} ${endMonth} ${endYear}`;
}

/**
 * Returns badge color and label for glucose value
 */
export function getGlucoseStatus(value) {
  const val = Number(value);
  if (val < 70) {
    return {
      label: 'Low',
      bgClass: 'bg-amber-100 text-amber-800 border-amber-200',
      dotClass: 'bg-amber-500',
    };
  }
  if (val <= 140) {
    return {
      label: 'Normal',
      bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dotClass: 'bg-emerald-500',
    };
  }
  if (val <= 180) {
    return {
      label: 'Elevated',
      bgClass: 'bg-orange-100 text-orange-800 border-orange-200',
      dotClass: 'bg-orange-500',
    };
  }
  return {
    label: 'High',
    bgClass: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
  };
}

export const TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

export const SLOT_INFO = {
  'Morning (fasting)': {
    short: 'Fasting',
    color: 'text-sky-700 bg-sky-50 border-sky-200',
    time: 'Before breakfast',
  },
  'After breakfast': {
    short: 'Breakfast',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    time: '2 hours post-meal',
  },
  'After lunch': {
    short: 'Lunch',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    time: '2 hours post-meal',
  },
  'After dinner': {
    short: 'Dinner',
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    time: '2 hours post-meal',
  },
};

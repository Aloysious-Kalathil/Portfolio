/** Format a date-ish value (Date, ISO string, or year) for display. */
export function formatDate(value, options = { year: 'numeric', month: 'short' }) {
  if (value == null || value === '') return ''
  if (typeof value === 'number' || /^\d{4}$/.test(String(value))) return String(value)
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-GB', options).format(date)
}

/** Current time in a given IANA timezone, e.g. "14:05". */
export function formatClock(timezone, date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).format(date)
  } catch {
    return ''
  }
}

/** Zero-padded index label: 1 → "01". */
export const pad = (n, size = 2) => String(n).padStart(size, '0')

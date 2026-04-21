/**
 * Returns a date string in YYYY-MM-DD format for a given date.
 * Uses the local timezone, not UTC, to avoid off-by-one day issues.
 */
export function getDateString(daysAgo: number = 0, fromDate = new Date()): string {
  const date = new Date(fromDate);
  date.setDate(date.getDate() - daysAgo);
  // Use 'en-CA' locale which returns YYYY-MM-DD format
  return date.toLocaleDateString('en-CA');
}

/**
 * Returns an array of day numbers (1-31) from the 1st of the month
 * up to the given date's day.
 */
export const getDaysFromDate = (date = new Date()) => {
  return Array.from({ length: date.getDate() }, (_, i) => i + 1);
};

/**
 * Formats a local date (year, month, day) as YYYY-MM-DD in local time.
 * Avoids UTC conversion issues that can cause off-by-one day errors.
 */
export function formatLocalDate(year: number, month: number, day: number): string {
  const date = new Date(year, month, day);
  return date.toLocaleDateString('en-CA');
}

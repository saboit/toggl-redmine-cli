export function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

export const getDaysFromDate = (date = new Date()) => {
  return Array.from({ length: date.getDate() }, (_, i) => i + 1);
};

export function getDefaultNightDate(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
  return new Date(today.getTime() + daysUntilThursday * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

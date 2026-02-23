export function getQualifyingDates(
  startDate: string,
  endDate: string,
  daysOfWeek: number[]
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const daySet = new Set(daysOfWeek);

  while (current <= end) {
    if (daySet.has(current.getDay())) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

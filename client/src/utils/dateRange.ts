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
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

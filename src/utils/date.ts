const MS_PER_DAY = 86_400_000;

export function toDayNumber(date: string | Date): number {
  const value = typeof date === "string" ? new Date(`${date.slice(0, 10)}T00:00:00`) : date;
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / MS_PER_DAY;
}

export function daysBetween(later: string | Date, earlier: string | Date): number {
  return Math.max(0, Math.floor(toDayNumber(later) - toDayNumber(earlier)));
}

export function todayIso(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${date.slice(0, 10)}T00:00:00`),
  );
}

export function formatDateTime(date: string, time: string | undefined, locale: string): string {
  const formattedDate = formatDate(date, locale);
  return time ? `${formattedDate}, ${time}` : formattedDate;
}

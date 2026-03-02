import dayjs from "dayjs";

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function iso(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}

export function norwegianHolidays(year: number): Record<string, string> {
  const easter = dayjs(easterSunday(year));
  const holidays: Record<string, string> = {
    [`${year}-01-01`]: "1. nyttarsdag",
    [`${year}-05-01`]: "Arbeidernes dag",
    [`${year}-05-17`]: "Grunnlovsdag",
    [`${year}-12-25`]: "1. juledag",
    [`${year}-12-26`]: "2. juledag",
    [iso(easter.subtract(3, "day").toDate())]: "Skjaertorsdag",
    [iso(easter.subtract(2, "day").toDate())]: "Langfredag",
    [iso(easter.toDate())]: "1. paskedag",
    [iso(easter.add(1, "day").toDate())]: "2. paskedag",
    [iso(easter.add(39, "day").toDate())]: "Kristi himmelfartsdag",
    [iso(easter.add(49, "day").toDate())]: "1. pinsedag",
    [iso(easter.add(50, "day").toDate())]: "2. pinsedag",
  };
  return holidays;
}

export function getNorwegianHoliday(isoDate: string): string | null {
  const d = dayjs(isoDate, "YYYY-MM-DD", true);
  if (!d.isValid()) return null;
  const map = norwegianHolidays(d.year());
  return map[isoDate] ?? null;
}

import dayjs from "dayjs";

export function getStemplingCutoff(today = new Date()): Date {
  return dayjs(today).startOf("month").add(4, "day").toDate();
}

export function toIsoDateTime(date: Date, hour: string, minute: string): string {
  return dayjs(date)
    .hour(Number(hour))
    .minute(Number(minute))
    .second(0)
    .millisecond(0)
    .toISOString();
}

export function formatDateLabel(dateIso?: string | null): string {
  if (!dateIso) return "";
  return dayjs(dateIso).format("DD.MM.YYYY");
}

export function formatTimeLabel(dateIso?: string | null): string {
  if (!dateIso) return "";
  return dayjs(dateIso).format("HH:mm");
}

export function isSameDay(aIso?: string | null, bIso?: string | null): boolean {
  if (!aIso || !bIso) return false;
  return dayjs(aIso).isSame(dayjs(bIso), "day");
}

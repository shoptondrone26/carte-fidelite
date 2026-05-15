import { BOOKING_TIMEZONE } from "@/lib/booking/config";

export function formatSlotDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: BOOKING_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    timeZone: BOOKING_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSlotDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: BOOKING_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function parisDateKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: BOOKING_TIMEZONE });
}

export function parisDateLabel(dateKey: string): string {
  const [y, m, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
  return utc.toLocaleDateString("fr-FR", {
    timeZone: BOOKING_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

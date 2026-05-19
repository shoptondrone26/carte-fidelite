import { BOOKING_TIMEZONE } from "@/lib/booking/config";

export type ParisWallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function getParisWallParts(date: Date): ParisWallTime {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
  };
}

/** Même créneau mur Paris (indépendant de la représentation UTC exacte). */
export function sameParisWallSlot(
  a: Date | string,
  b: Date | string,
): boolean {
  const pa = getParisWallParts(a instanceof Date ? a : new Date(a));
  const pb = getParisWallParts(b instanceof Date ? b : new Date(b));
  return (
    pa.year === pb.year &&
    pa.month === pb.month &&
    pa.day === pb.day &&
    pa.hour === pb.hour &&
    pa.minute === pb.minute
  );
}

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

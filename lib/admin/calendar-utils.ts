import { BOOKING_OPEN_HOUR, BOOKING_TIMEZONE } from "@/lib/booking/config";
import { parisDateKey, sameParisWallSlot } from "@/lib/booking/format";
import {
  generateSlotStartsForDate,
  getBookableDateKeys,
  parisWallToUtc,
  slotDurationMs,
} from "@/lib/booking/slots";

export function findBookingForSlot<T extends { starts_at: string }>(
  bookings: T[],
  slot: Date,
): T | undefined {
  const slotMs = slot.getTime();
  const exact = bookings.find(
    (b) => new Date(b.starts_at).getTime() === slotMs,
  );
  if (exact) return exact;
  return bookings.find((b) => sameParisWallSlot(b.starts_at, slot));
}

export function calendarDayRange(dateKey: string): {
  startIso: string;
  endIso: string;
} {
  const slots = generateSlotStartsForDate(dateKey);
  const [y, m, d] = dateKey.split("-").map(Number);
  const start =
    slots[0] ?? parisWallToUtc(y, m, d, BOOKING_OPEN_HOUR, 0);
  const last = slots[slots.length - 1] ?? start;
  const end = new Date(last.getTime() + slotDurationMs() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

/** Lundi de la semaine contenant dateKey (Paris). */
export function weekStartKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const noon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    weekday: "short",
  }).format(noon);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const offset = map[weekday.slice(0, 3)] ?? 0;
  const monday = new Date(noon);
  monday.setUTCDate(monday.getUTCDate() - offset);
  return parisDateKey(monday);
}

export function weekDateKeys(weekStart: string): string[] {
  const [y, m, d] = weekStart.split("-").map(Number);
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(Date.UTC(y, m - 1, d + i, 12, 0, 0));
    keys.push(parisDateKey(day));
  }
  return keys;
}

export function weekRange(weekStart: string): {
  startIso: string;
  endIso: string;
} {
  const keys = weekDateKeys(weekStart);
  const first = calendarDayRange(keys[0]!);
  const last = calendarDayRange(keys[6]!);
  return { startIso: first.startIso, endIso: last.endIso };
}

export function bookingAtSlot(
  bookings: { starts_at: string }[],
  slotIso: string,
): boolean {
  return Boolean(findBookingForSlot(bookings, new Date(slotIso)));
}

export function adminReservationsFetchRange(): {
  rangeStartIso: string;
  rangeEndIso: string;
} {
  const keys = getBookableDateKeys();
  const past = new Date();
  past.setDate(past.getDate() - 7);
  const pastKey = parisDateKey(past);
  const startKey = pastKey < keys[0]! ? pastKey : keys[0]!;
  const endKey = keys[keys.length - 1]!;
  const { startIso: rangeStartIso } = calendarDayRange(startKey);
  const { endIso: rangeEndIso } = calendarDayRange(endKey);
  return { rangeStartIso, rangeEndIso };
}

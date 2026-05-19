import {
  BOOKING_CLOSE_HOUR,
  BOOKING_HORIZON_DAYS,
  BOOKING_OPEN_HOUR,
  SLOT_MINUTES,
} from "@/lib/booking/config";
import {
  getParisWallParts,
  parisDateKey,
  type ParisWallTime,
} from "@/lib/booking/format";

/** Créneaux possibles pour une date (clé YYYY-MM-DD, fuseau Paris). */
export function generateSlotStartsForDate(dateKey: string): Date[] {
  const [y, m, d] = dateKey.split("-").map(Number);
  const slots: Date[] = [];

  for (let hour = BOOKING_OPEN_HOUR; hour < BOOKING_CLOSE_HOUR; hour++) {
    for (const minute of [0, 20, 40] as const) {
      slots.push(parisWallToUtc(y, m, d, hour, minute));
    }
  }

  return slots;
}

/** Prochaines dates réservables (clés YYYY-MM-DD, Paris). */
export function getBookableDateKeys(from = new Date()): string[] {
  const keys: string[] = [];
  let key = parisDateKey(from);

  for (let i = 0; i < BOOKING_HORIZON_DAYS; i++) {
    keys.push(key);
    key = addParisCalendarDays(key, 1);
  }

  return keys;
}

/** Instant UTC pour une date/heure murale Europe/Paris. */
export function parisWallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const target: ParisWallTime = { year, month, day, hour, minute };
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 12; i++) {
    const actual = getParisWallParts(new Date(utcMs));
    if (
      actual.year === year &&
      actual.month === month &&
      actual.day === day &&
      actual.hour === hour &&
      actual.minute === minute
    ) {
      return new Date(utcMs);
    }

    const diffMin =
      civilMinuteIndex(target) - civilMinuteIndex(actual);
    utcMs += diffMin * 60_000;
  }

  return new Date(utcMs);
}

function civilMinuteIndex(p: ParisWallTime): number {
  return (((p.year * 372 + p.month) * 31 + p.day) * 24 + p.hour) * 60 + p.minute;
}

function addParisCalendarDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const anchor = parisWallToUtc(y, m, d, 12, 0);
  return parisDateKey(new Date(anchor.getTime() + days * 86_400_000));
}

export function slotDurationMs(): number {
  return SLOT_MINUTES * 60_000;
}

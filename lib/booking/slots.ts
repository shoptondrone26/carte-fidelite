import {
  BOOKING_CLOSE_HOUR,
  BOOKING_HORIZON_DAYS,
  BOOKING_OPEN_HOUR,
  BOOKING_TIMEZONE,
  SLOT_MINUTES,
} from "@/lib/booking/config";
import { parisDateKey } from "@/lib/booking/format";

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
  let cursor = from;

  for (let i = 0; i < BOOKING_HORIZON_DAYS; i++) {
    keys.push(parisDateKey(cursor));
    cursor = new Date(cursor.getTime() + 86_400_000);
  }

  return keys;
}

function parisWallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 8; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: BOOKING_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(utc));

    const pick = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);

    const py = pick("year");
    const pm = pick("month");
    const pd = pick("day");
    const ph = pick("hour");
    const pmin = pick("minute");

    if (
      py === year &&
      pm === month &&
      pd === day &&
      ph === hour &&
      pmin === minute
    ) {
      return new Date(utc);
    }

    const targetDayMin = day * 1440 + hour * 60 + minute;
    const actualDayMin = pd * 1440 + ph * 60 + pmin;
    const dayDelta = (year - py) * 365 + (month - pm) * 31 + (day - pd);
    utc += (dayDelta * 1440 + (targetDayMin - actualDayMin)) * 60_000;
  }

  return new Date(utc);
}

export function slotDurationMs(): number {
  return SLOT_MINUTES * 60_000;
}

import { generateSlotStartsForDate } from "@/lib/booking/slots";

export type SlotOption = {
  startsAt: string;
  label: string;
  available: boolean;
};

export function buildSlotOptions(
  dateKey: string,
  occupiedIso: string[],
  now = new Date(),
): SlotOption[] {
  const occupied = new Set(occupiedIso.map((s) => new Date(s).toISOString()));
  const slots = generateSlotStartsForDate(dateKey);

  return slots.map((start) => {
    const iso = start.toISOString();
    const inPast = start.getTime() <= now.getTime();
    const taken = occupied.has(iso);
    return {
      startsAt: iso,
      label: start.toLocaleTimeString("fr-FR", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
      }),
      available: !inPast && !taken,
    };
  });
}

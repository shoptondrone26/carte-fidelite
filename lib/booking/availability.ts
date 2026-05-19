import { sameParisWallSlot } from "@/lib/booking/format";
import { generateSlotStartsForDate } from "@/lib/booking/slots";

export type SlotOption = {
  startsAt: string;
  label: string;
  available: boolean;
};

function isSlotOccupied(slot: Date, occupiedIso: string[]): boolean {
  return occupiedIso.some((iso) => {
    const occ = new Date(iso);
    return (
      occ.getTime() === slot.getTime() || sameParisWallSlot(occ, slot)
    );
  });
}

export function buildSlotOptions(
  dateKey: string,
  occupiedIso: string[],
  now = new Date(),
): SlotOption[] {
  const slots = generateSlotStartsForDate(dateKey);

  return slots.map((start) => {
    const iso = start.toISOString();
    const inPast = start.getTime() <= now.getTime();
    const taken = isSlotOccupied(start, occupiedIso);
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

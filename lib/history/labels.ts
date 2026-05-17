export const historyEventLabelFr: Record<string, string> = {
  unlock_validated: "Déblocage validé",
  unlock_cancelled: "Déblocage annulé",
  free_used: "Gratuit utilisé",
  booking_accepted: "Réservation acceptée",
  booking_refused: "Réservation refusée",
  booking_requested: "Demande envoyée",
  booking_cancelled: "Demande annulée",
  gift_requested: "Cadeau demandé",
  gift_accepted: "Cadeau accepté",
  gift_refused: "Cadeau refusé",
  gift_sent: "Cadeau envoyé",
  gift_cancelled: "Cadeau annulé",
  client_reset: "Client réinitialisé",
};

export function formatHistoryEventType(eventType: string): string {
  return (
    historyEventLabelFr[eventType] ??
    eventType.replaceAll("_", " ")
  );
}

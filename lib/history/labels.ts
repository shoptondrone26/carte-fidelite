export const historyEventLabelFr: Record<string, string> = {
  unlock_validated: "Déblocage validé",
  unlock_cancelled: "Déblocage annulé",
  free_used: "Gratuit utilisé",
  booking_accepted: "Réservation acceptée",
  booking_refused: "Réservation refusée",
  booking_requested: "Demande envoyée",
  booking_cancelled: "Demande annulée",
  phantom_mode_requested: "Mode Phantom demandé",
  phantom_mode_updated: "Mode Phantom mis à jour",
  phantom_mode_completed: "Mode Phantom terminé",
  client_reset: "Client réinitialisé",
};

export function formatHistoryEventType(eventType: string): string {
  return (
    historyEventLabelFr[eventType] ??
    eventType.replaceAll("_", " ")
  );
}

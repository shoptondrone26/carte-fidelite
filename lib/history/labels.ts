export const historyEventLabelFr: Record<string, string> = {
  unlock_validated: "Déblocage validé",
  unlock_cancelled: "Déblocage annulé",
  free_used: "Gratuit utilisé",
  booking_accepted: "Réservation acceptée",
  booking_refused: "Réservation refusée",
  booking_requested: "Demande envoyée",
  booking_cancelled: "Demande annulée",
  phantom_requested: "Mode Fantôme demandé",
  phantom_accepted: "Mode Fantôme accepté",
  phantom_payment_pending: "Paiement Mode Fantôme en attente",
  phantom_paid: "Paiement Mode Fantôme reçu",
  phantom_in_progress: "Mode Fantôme en cours",
  phantom_completed: "Mode Fantôme terminé",
  phantom_cancelled: "Mode Fantôme annulé",
  phantom_refused: "Mode Fantôme refusé",
  phantom_mode_updated: "Mode Fantôme mis à jour",
  shop_order_payment_pending: "Commande boutique — paiement en attente",
  shop_order_paid: "Commande boutique — payée",
  shop_order_preparing: "Commande boutique — en préparation",
  shop_order_shipped: "Commande boutique — expédiée",
  shop_order_completed: "Commande boutique — terminée",
  shop_order_cancelled: "Commande boutique annulée",
  shop_order_refused: "Commande boutique refusée",
  shop_order_expired: "Commande boutique expirée",
  client_reset: "Client réinitialisé",
};

export function formatHistoryEventType(eventType: string): string {
  return (
    historyEventLabelFr[eventType] ??
    eventType.replaceAll("_", " ")
  );
}

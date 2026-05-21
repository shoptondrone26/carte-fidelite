-- Notifications réservation : envoyées depuis les Server Actions Next.js (OneSignal direct).
-- Évite les doublons avec l’ancien trigger history → notification_outbox.

begin;

create or replace function public.enqueue_push_from_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- booking_accepted / booking_refused : gérés côté serveur (actions réservation).
  return new;
end;
$$;

commit;

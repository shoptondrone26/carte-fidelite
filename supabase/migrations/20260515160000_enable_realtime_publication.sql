-- R0: Enable Supabase Realtime (postgres_changes) on app tables.
-- RLS still filters which events each role receives.

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.history;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.accounting_transactions;
exception
  when duplicate_object then null;
end $$;

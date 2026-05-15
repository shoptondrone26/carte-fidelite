-- Marquer un gratuit comme utilisé (admin) — sans modifier total_unlocks

create or replace function public.mark_free_used(p_profile_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_earned int;
  v_used int;
begin
  if not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  select total_unlocks into v_total
  from public.profiles
  where id = p_profile_id;
  if not found then
    raise exception 'not_found';
  end if;

  v_earned := v_total / 3;

  select count(*)::int into v_used
  from public.history
  where subject_id = p_profile_id
    and event_type = 'free_used';

  if v_earned - v_used <= 0 then
    raise exception 'no_free_available';
  end if;

  insert into public.history(
    subject_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    payload)
  values (
    p_profile_id,
    auth.uid(),
    'free_used',
    'profile',
    p_profile_id,
    jsonb_build_object('profile_id', p_profile_id));
end;
$$;

revoke all on function public.mark_free_used(uuid) from public;

grant execute on function public.mark_free_used(uuid) to authenticated;

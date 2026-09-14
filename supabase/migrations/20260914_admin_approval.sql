-- Capacity Connect: admin approval workflow
-- Apply this migration in the Supabase SQL editor/migration pipeline.
-- The app intentionally keeps admin registrations pending until an existing admin approves them.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and account_status = 'active'
  );
$$;

revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.review_profile(target_profile_id uuid, decision text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Only active administrators can review registrations';
  end if;

  if decision not in ('approve', 'reject') then
    raise exception 'Decision must be approve or reject';
  end if;

  update public.profiles
  set account_status = case when decision = 'approve' then 'active' else 'rejected' end
  where id = target_profile_id
    and account_status = 'pending';

  return found;
end;
$$;

revoke all on function public.review_profile(uuid, text) from public, anon;
grant execute on function public.review_profile(uuid, text) to authenticated;

create or replace function public.list_pending_profiles()
returns setof public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.profiles p
  where p.account_status = 'pending'
    and public.is_platform_admin();
$$;

revoke all on function public.list_pending_profiles() from public, anon;
grant execute on function public.list_pending_profiles() to authenticated;

-- The signup trigger is invoked by PostgreSQL itself; clients do not need
-- direct permission to execute the trigger function.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

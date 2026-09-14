-- Capacity Connect: hardened admin approval workflow
-- Apply through the Supabase SQL editor or migration pipeline.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
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
set search_path = public, pg_temp
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Only active administrators can review registrations';
  end if;

  if decision not in ('approve', 'reject') then
    raise exception 'Decision must be approve or reject';
  end if;

  if target_profile_id = auth.uid() then
    raise exception 'Administrators cannot review their own account';
  end if;

  update public.profiles
  set account_status = case when decision = 'approve' then 'active' else 'rejected' end,
      updated_at = now()
  where id = target_profile_id
    and account_status = 'pending'
    and role in ('trainee', 'trainer', 'admin');

  return found;
end;
$$;

revoke all on function public.review_profile(uuid, text) from public, anon;
grant execute on function public.review_profile(uuid, text) to authenticated;

-- Do not expose biometric vectors or other sensitive profile columns through the
-- admin queue. Return only fields needed by the approval UI.
create or replace function public.list_pending_profiles()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  institute text,
  designation text,
  qualifications text,
  ncf_id text,
  igot_karma_points integer,
  account_status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.institute,
    p.designation,
    p.qualifications,
    p.ncf_id,
    p.igot_karma_points,
    p.account_status,
    p.created_at
  from public.profiles p
  where p.account_status = 'pending'
    and p.role in ('trainee', 'trainer', 'admin')
    and public.is_platform_admin();
$$;

revoke all on function public.list_pending_profiles() from public, anon;
grant execute on function public.list_pending_profiles() to authenticated;

-- The signup trigger is invoked by PostgreSQL itself; clients do not need
-- direct permission to execute the trigger function.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

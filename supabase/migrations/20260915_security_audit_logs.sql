create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.security_audit_logs enable row level security;
revoke all on public.security_audit_logs from anon, authenticated;

create index if not exists security_audit_logs_created_at_idx on public.security_audit_logs (created_at desc);
create index if not exists security_audit_logs_event_type_idx on public.security_audit_logs (event_type);

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and account_status='active');
$$;
revoke all on function private.is_platform_admin() from public;
grant execute on function private.is_platform_admin() to authenticated;

create or replace function public.is_platform_admin()
returns boolean language sql stable security invoker set search_path=public,pg_temp as $$
  select private.is_platform_admin();
$$;
revoke execute on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create or replace function private.list_pending_profiles()
returns table(id uuid,email text,full_name text,role text,institute text,designation text,qualifications text,account_status text,created_at timestamptz)
language sql stable security definer set search_path=public,pg_temp as $$
  select p.id,p.email,p.full_name,p.role,p.institute,p.designation,p.qualifications,p.account_status,p.created_at
  from public.profiles p
  where p.account_status='pending' and p.role in ('trainee','trainer','admin') and private.is_platform_admin();
$$;
revoke all on function private.list_pending_profiles() from public;
grant execute on function private.list_pending_profiles() to authenticated;

create or replace function public.list_pending_profiles()
returns table(id uuid,email text,full_name text,role text,institute text,designation text,qualifications text,account_status text,created_at timestamptz)
language sql stable security invoker set search_path=public,pg_temp as $$
  select * from private.list_pending_profiles();
$$;
revoke execute on function public.list_pending_profiles() from public, anon;
grant execute on function public.list_pending_profiles() to authenticated;

create or replace function private.write_security_audit(p_actor_id uuid,p_event_type text,p_target_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null or auth.uid()<>p_actor_id then raise exception 'Unauthorized'; end if;
  insert into public.security_audit_logs(actor_id,event_type,target_user_id,metadata)
  values(p_actor_id,p_event_type,p_target_user_id,coalesce(p_metadata,'{}'::jsonb));
end;
$$;
revoke all on function private.write_security_audit(uuid,text,uuid,jsonb) from public;
grant execute on function private.write_security_audit(uuid,text,uuid,jsonb) to authenticated;

create or replace function private.review_profile(target_profile_id uuid,decision text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare changed boolean;
begin
  if not private.is_platform_admin() then raise exception 'Only active administrators can review registrations'; end if;
  if decision not in ('approve','reject') then raise exception 'Decision must be approve or reject'; end if;
  if target_profile_id=auth.uid() then raise exception 'Administrators cannot review their own account'; end if;
  update public.profiles
    set account_status=case when decision='approve' then 'active' else 'rejected' end,
        approved_at=case when decision='approve' then now() else null end,
        approved_by=case when decision='approve' then auth.uid() else null end,
        updated_at=now()
  where id=target_profile_id and account_status='pending' and role in ('trainee','trainer','admin');
  changed:=found;
  if changed then perform private.write_security_audit(auth.uid(),case when decision='approve' then 'account_approve' else 'account_reject' end,target_profile_id,jsonb_build_object('decision',decision)); end if;
  return changed;
end;
$$;
revoke all on function private.review_profile(uuid,text) from public;
grant execute on function private.review_profile(uuid,text) to authenticated;

create or replace function public.review_profile(target_profile_id uuid,decision text)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin return private.review_profile(target_profile_id,decision); end;
$$;
revoke execute on function public.review_profile(uuid,text) from public, anon;
grant execute on function public.review_profile(uuid,text) to authenticated;

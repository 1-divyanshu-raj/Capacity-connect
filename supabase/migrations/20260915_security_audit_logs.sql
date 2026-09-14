create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.security_audit_logs enable row level security;

create index if not exists security_audit_logs_created_at_idx
  on public.security_audit_logs (created_at desc);
create index if not exists security_audit_logs_event_type_idx
  on public.security_audit_logs (event_type);

revoke all on public.security_audit_logs from anon, authenticated;

create or replace function public.write_security_audit(
  p_event_type text,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.security_audit_logs(actor_id, event_type, target_user_id, metadata)
  values (auth.uid(), p_event_type, p_target_user_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke all on function public.write_security_audit(text, uuid, jsonb) from public, anon;
grant execute on function public.write_security_audit(text, uuid, jsonb) to authenticated;

create or replace function public.review_profile(target_profile_id uuid, decision text)
returns public.profiles
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.profiles;
  actor uuid := auth.uid();
  new_status text;
begin
  if actor is null or not public.is_platform_admin() then
    raise exception 'Active admin privileges required';
  end if;

  if target_profile_id = actor then
    raise exception 'Administrators cannot approve or reject themselves';
  end if;

  if decision not in ('approve', 'reject') then
    raise exception 'Invalid decision';
  end if;

  new_status := case when decision = 'approve' then 'active' else 'rejected' end;

  update public.profiles
     set account_status = new_status,
         approval_notes = case when decision = 'approve' then null else 'Registration rejected by administrator' end,
         approved_at = case when decision = 'approve' then now() else null end,
         approved_by = case when decision = 'approve' then actor else null end,
         updated_at = now()
   where id = target_profile_id
     and account_status = 'pending'
  returning * into target;

  if target.id is null then
    raise exception 'Pending profile not found';
  end if;

  insert into public.security_audit_logs(actor_id, event_type, target_user_id, metadata)
  values (actor, 'account_' || decision, target_profile_id, jsonb_build_object('role', target.role));

  return target;
end;
$$;

revoke all on function public.review_profile(uuid, text) from public, anon, authenticated;
grant execute on function public.review_profile(uuid, text) to authenticated;

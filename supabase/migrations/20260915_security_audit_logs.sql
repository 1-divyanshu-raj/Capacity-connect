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

create or replace function public.write_security_audit(
  p_actor_id uuid,
  p_event_type text,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or auth.uid() <> p_actor_id then
    raise exception 'Unauthorized';
  end if;
  insert into public.security_audit_logs(actor_id,event_type,target_user_id,metadata)
  values (p_actor_id,p_event_type,p_target_user_id,coalesce(p_metadata,'{}'::jsonb));
end;
$$;

revoke execute on function public.write_security_audit(uuid,text,uuid,jsonb) from public, anon;
grant execute on function public.write_security_audit(uuid,text,uuid,jsonb) to authenticated;

create or replace function public.review_profile(target_profile_id uuid, decision text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed boolean;
begin
  if not public.is_platform_admin() then
    raise exception 'Only active administrators can review registrations';
  end if;
  if decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject';
  end if;
  if target_profile_id = auth.uid() then
    raise exception 'Administrators cannot review their own account';
  end if;

  update public.profiles
     set account_status = case when decision='approve' then 'active' else 'rejected' end,
         approved_at = case when decision='approve' then now() else null end,
         approved_by = case when decision='approve' then auth.uid() else null end,
         updated_at = now()
   where id = target_profile_id
     and account_status = 'pending'
     and role in ('trainee','trainer','admin');

  changed := found;
  if changed then
    perform public.write_security_audit(
      auth.uid(),
      case when decision='approve' then 'account_approve' else 'account_reject' end,
      target_profile_id,
      jsonb_build_object('decision',decision)
    );
  end if;
  return changed;
end;
$$;

revoke execute on function public.review_profile(uuid,text) from public, anon;
grant execute on function public.review_profile(uuid,text) to authenticated;

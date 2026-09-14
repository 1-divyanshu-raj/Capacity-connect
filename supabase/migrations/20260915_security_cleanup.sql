-- Security/performance cleanup and safe RPC exposure.
-- The privileged RPCs perform their own active-admin authorization checks.

create index if not exists profiles_approved_by_idx on public.profiles (approved_by);

revoke execute on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;
revoke execute on function public.list_pending_profiles() from public, anon;
grant execute on function public.list_pending_profiles() to authenticated;
revoke execute on function public.review_profile(uuid, text) from public, anon;
grant execute on function public.review_profile(uuid, text) to authenticated;

-- Keep pgvector outside the exposed public schema.
alter extension vector set schema extensions;

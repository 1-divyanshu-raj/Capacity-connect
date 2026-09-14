-- Security/performance cleanup applied to the live project.
-- Safe to replay on environments where these objects already exist.

create index if not exists profiles_approved_by_idx on public.profiles (approved_by);

revoke execute on function public.is_platform_admin() from authenticated;
revoke execute on function public.list_pending_profiles() from authenticated;
revoke execute on function public.review_profile(uuid, text) from authenticated;

-- Keep pgvector outside the exposed public schema.
alter extension vector set schema extensions;

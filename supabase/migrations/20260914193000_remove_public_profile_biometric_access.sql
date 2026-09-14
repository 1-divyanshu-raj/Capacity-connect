-- Keep biometric/profile data out of the public Data API.
drop policy if exists "Allow public insert for profile creation" on public.profiles;
drop policy if exists "Allow public read for face matching" on public.profiles;
drop policy if exists "Allow users to update own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own_v2" on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own_v2" on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own_v2" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

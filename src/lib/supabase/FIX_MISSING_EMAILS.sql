-- CRITICAL FIX: Backfill missing emails in public.profiles

-- 1. Sync Email from auth.users to public.profiles where generic or missing
-- This joins auth.users and public.profiles on ID and updates the profile email
update public.profiles
set email = auth.users.email
from auth.users
where public.profiles.id = auth.users.id
and (public.profiles.email is null or public.profiles.email = '');

-- 2. Sync Username if missing (fallback to email prefix)
update public.profiles
set username = coalesce(auth.users.raw_user_meta_data->>'username', split_part(auth.users.email, '@', 1))
from auth.users
where public.profiles.id = auth.users.id
and (public.profiles.username is null or public.profiles.username = 'Unknown');

-- 3. Ensure trigger exists for FUTURE users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username);
  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate trigger to be safe
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Backfill completely missing profiles (users in Auth but not in Profiles)
insert into public.profiles (id, email, username)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1))
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

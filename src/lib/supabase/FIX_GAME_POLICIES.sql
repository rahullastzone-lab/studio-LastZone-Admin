-- Fix 'Coming Soon' Toggle Issue (RLS Policies for Games Table)

-- 1. Ensure 'is_active' column exists (just in case)
alter table public.games add column if not exists is_active boolean default true;

-- 2. Enable RLS (standard practice, even if we make it public)
alter table public.games enable row level security;

-- 3. DROP ALL EXISTING POLICIES to remove conflicts/restrictions
drop policy if exists "Public Read" on public.games;
drop policy if exists "Anon Insert" on public.games;
drop policy if exists "Anon Update" on public.games;
drop policy if exists "Anon Delete" on public.games;
drop policy if exists "Enable Read Access" on public.games;
drop policy if exists "Enable Insert Access" on public.games;
drop policy if exists "Enable Update Access" on public.games;
drop policy if exists "Enable Delete Access" on public.games;
drop policy if exists "Enable update for all users" on public.games;

-- 4. CREATE NEW PERMISSIVE POLICIES (Allow everything for everyone for now to fix the bug)
create policy "Enable Read Access" on public.games for select using (true);
create policy "Enable Insert Access" on public.games for insert with check (true);
create policy "Enable Update Access" on public.games for update using (true);
create policy "Enable Delete Access" on public.games for delete using (true);

-- 5. FIX STORAGE POLICIES (Images Bucket)
-- Ensure the bucket exists
insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict (id) do nothing;

-- Drop existing storage policies for 'images'
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Auth Upload" on storage.objects;
drop policy if exists "Update Image" on storage.objects;
drop policy if exists "Delete Image" on storage.objects;
drop policy if exists "Allow Upload" on storage.objects;
drop policy if exists "Allow Update" on storage.objects;
drop policy if exists "Allow Delete" on storage.objects;

-- Create permissive storage policies
create policy "Public Access" on storage.objects for select using ( bucket_id = 'images' );
create policy "Allow Upload" on storage.objects for insert with check ( bucket_id = 'images' );
create policy "Allow Update" on storage.objects for update with check ( bucket_id = 'images' );
create policy "Allow Delete" on storage.objects for delete using ( bucket_id = 'images' );

-- 6. Force Schema Cache Reload (Critical for immediate effect)
NOTIFY pgrst, 'reload schema';

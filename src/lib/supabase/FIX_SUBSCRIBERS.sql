-- Ensure the table exists
create table if not exists public.notify_subscribers (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now()
);

-- Add columns if they don't exist
alter table public.notify_subscribers add column if not exists guest_name text;
alter table public.notify_subscribers add column if not exists email text;
alter table public.notify_subscribers add column if not exists whatsapp_number text;
alter table public.notify_subscribers add column if not exists service_type text;
alter table public.notify_subscribers add column if not exists service_name text;

-- Enable RLS
alter table public.notify_subscribers enable row level security;

-- Policy: Allow anyone to INSERT (for the "Notify Me" form on main website)
drop policy if exists "Anon Insert" on public.notify_subscribers;
create policy "Anon Insert" on public.notify_subscribers for insert with check (true);

-- Policy: Allow Admins (or authenticated users for now) to SELECT
drop policy if exists "Admin Select" on public.notify_subscribers;
create policy "Admin Select" on public.notify_subscribers for select using (true);

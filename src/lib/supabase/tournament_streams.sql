-- Create tournament_streams table if it doesn't exist
create table if not exists public.tournament_streams (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) not null,
  youtube_url text not null,
  start_time timestamptz,
  end_time timestamptz,
  status text default 'Scheduled', -- 'Scheduled', 'Live', 'Ended'
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.tournament_streams enable row level security;

-- Policies
create policy "Public Read" on public.tournament_streams for select using (true);
create policy "Admin Insert" on public.tournament_streams for insert with check (true); -- Simplification for this app context
create policy "Admin Update" on public.tournament_streams for update using (true);
create policy "Admin Delete" on public.tournament_streams for delete using (true);

-- 1. Ensure pg_cron is enabled
-- create extension if not exists pg_cron;

-- 2. Create the function to generate daily tournaments
create or replace function public.generate_daily_tournaments()
returns void as $$
declare
  game_record record;
  t_id uuid;
  start_hour integer;
  -- FIX: Use IST Date instead of UTC Date
  -- At 18:30 UTC, it is still the previous day in UTC, but next day (12:00 AM) in IST.
  now_date date := (now() AT TIME ZONE 'Asia/Kolkata')::date; 
  tournament_time timestamptz;
  -- Default settings
  default_game_name text := 'BGMI'; 
  default_map text := 'Erangel';
  default_mode text := 'Solo';
  default_entry_fee numeric := 25;
  default_prize_pool numeric := 750;
  default_per_kill numeric := 5;
begin
  -- Fetch the Game ID for the default game (e.g., BGMI)
  select * into game_record from public.games where name = default_game_name limit 1;
  
  if game_record is null then
    raise notice 'Game % not found, skipping tournament generation.', default_game_name;
    return;
  end if;

  -- Loop through 0 to 22 (Every 2 hours: 0, 2, 4, ..., 22)
  for start_hour in 0..22 by 2 loop
    -- Calculate the timestamp for the target date at specific hour
    -- We construct the timestamp explicitly for the target date
    tournament_time := now_date + make_interval(hours => start_hour);

    -- Insert Tournament
    insert into public.tournaments (
      name,
      game_id,
      game_type, -- Stores Game Name (e.g., BGMI)
      mode,      -- Stores Mode (e.g., Solo)
      map,
      entry_fee,
      prize_pool,
      per_kill,
      start_time,
      status,
      category,
      is_coming_soon
    ) values (
      'BATTLEGROUND MOBILE INDIA',
      game_record.id,
      default_game_name, -- 'BGMI'
      default_mode,      -- 'Solo'
      default_map,
      default_entry_fee,
      default_prize_pool,
      default_per_kill,
      tournament_time,
      'Open',
      'Normal',
      false
    ) returning id into t_id;

    -- Insert Match for the Tournament
    insert into public.matches (
      tournament_id,
      start_time,
      status,
      room_id,
      room_password
    ) values (
      t_id,
      tournament_time,
      'Scheduled',
      '', 
      '' 
    );
    
  end loop;
end;
$$ language plpgsql;

-- 3. Schedule function (Runs every day at 12:00 AM IST / 18:30 UTC)
select cron.schedule(
  'generate-daily-tournaments',
  '30 18 * * *',
  'select public.generate_daily_tournaments()'
);

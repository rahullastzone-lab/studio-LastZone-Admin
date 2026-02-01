-- 1. Ensure pg_cron is enabled (You've already done this!)
-- create extension if not exists pg_cron;

-- 2. Create the function to generate daily tournaments
create or replace function public.generate_daily_tournaments()
returns void as $$
declare
  game_record record;
  t_id uuid;
  start_hour integer;
  now_date date := current_date; -- Get current date
  tournament_time timestamptz;
  -- Default settings for the auto-tournaments (Adjust these as needed)
  default_game_name text := 'BGMI'; -- Change to your preferred default game
  default_map text := 'Erangel';
  default_mode text := 'Solo';
  default_entry_fee numeric := 10;
  default_prize_pool numeric := 500;
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
    -- Calculate the timestamp for today at specific hour
    tournament_time := now_date + make_interval(hours => start_hour);

    -- Insert Tournament
    insert into public.tournaments (
      name,
      game_id,
      game_type,
      map,
      entry_fee,
      prize_pool,
      per_kill,
      start_time,
      status,
      category,
      is_coming_soon
    ) values (
      'Daily Solo Blast ' || to_char(tournament_time, 'HH12 AM'), -- e.g., "Daily Solo Blast 02 PM"
      game_record.id,
      default_game_name,
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
      '', -- Empty Room ID initially
      ''  -- Empty Password initially
    );
    
  end loop;
end;
$$ language plpgsql;

-- 3. Schedule the function to run every day at 12:00 AM IST
-- We use a CRON expression for this.
-- If your database is in UTC (which Supabase usually is), 12:00 AM IST = 6:30 PM UTC previous day.
-- So we generally schedule it for 18:30 UTC.
-- '30 18 * * *' means "At 18:30 every day".

select cron.schedule(
  'generate-daily-tournaments', -- Job name (must be unique)
  '30 18 * * *',                -- Schedule (18:30 UTC = 00:00 IST)
  'select public.generate_daily_tournaments()' -- SQL command to run
);

-- 4. (Optional) Run once immediately for TESTING
-- select public.generate_daily_tournaments();

-- 5. Verify it's scheduled
select * from cron.job;

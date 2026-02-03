-- RESET_AND_SETUP_SCHEDULE.sql

-- 1. CLEANUP (Removes "Wrong" 7:30 PM type tournaments and resets for Today)
DELETE FROM public.matches 
WHERE tournament_id IN (
    SELECT id FROM public.tournaments 
    WHERE game_type = 'BGMI' 
      AND mode = 'Solo' 
      -- Delete anything scheduled for TODAY or FUTURE (to remove the wrong ones created just now)
      AND start_time >= (now() AT TIME ZONE 'Asia/Kolkata')::date
);

DELETE FROM public.tournaments 
WHERE game_type = 'BGMI' 
  AND mode = 'Solo' 
  AND start_time >= (now() AT TIME ZONE 'Asia/Kolkata')::date;


-- 2. DEFINE THE FUNCTION (Strict IST Logic with Timezone Interpretation)
CREATE OR REPLACE FUNCTION public.generate_daily_tournaments()
RETURNS void AS $$
DECLARE
  game_record record;
  t_id uuid;
  start_hour integer;
  target_date date := (now() AT TIME ZONE 'Asia/Kolkata')::date; 
  tournament_time timestamptz;
  
  -- Settings
  default_game_name text := 'BGMI'; 
  default_map text := 'Erangel';
  default_mode text := 'Solo';
  default_entry_fee numeric := 25;
  default_prize_pool numeric := 750;
  default_per_kill numeric := 5;
BEGIN
  -- Fetch Game ID
  SELECT * INTO game_record FROM public.games WHERE name = default_game_name LIMIT 1;
  
  IF game_record IS NULL THEN
    RAISE NOTICE 'Game % not found.', default_game_name;
    RETURN;
  END IF;

  -- Loop: 0, 2, 4, ... 22 (Hours)
  FOR start_hour IN 0..22 BY 2 LOOP
    
    -- FIX: Explicitly interpret the time as IST
    -- (Date + Hour) is a timestamp. We tell Postgres "This timestamp IS IN Asia/Kolkata".
    tournament_time := (target_date + make_interval(hours => start_hour)) AT TIME ZONE 'Asia/Kolkata';

    -- Insert Tournament
    INSERT INTO public.tournaments (
      name,
      game_id,
      game_type, -- Game Name
      mode,      -- Mode
      map,
      entry_fee,
      prize_pool,
      per_kill,
      start_time,
      status,
      category,
      is_coming_soon
    ) VALUES (
      'BATTLEGROUND MOBILE INDIA',
      game_record.id,
      default_game_name,
      default_mode,
      default_map,
      default_entry_fee,
      default_prize_pool,
      default_per_kill,
      tournament_time,
      'Open',
      'Normal',
      false
    ) RETURNING id INTO t_id;

    -- Insert Match
    INSERT INTO public.matches (
      tournament_id,
      start_time,
      status,
      room_id,
      room_password
    ) VALUES (
      t_id,
      tournament_time,
      'Scheduled',
      '', 
      '' 
    );
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;


-- 3. SCHEDULE CRON JOB
SELECT cron.unschedule('generate-daily-tournaments');

-- Schedule: 18:30 UTC = 12:00 AM IST
SELECT cron.schedule(
  'generate-daily-tournaments',
  '30 18 * * *',
  'select public.generate_daily_tournaments()'
);

-- 4. RUN MANUALLY ONCE for Today (Corrected)
SELECT public.generate_daily_tournaments();

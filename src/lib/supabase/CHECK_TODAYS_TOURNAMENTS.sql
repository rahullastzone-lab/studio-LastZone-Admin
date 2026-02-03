-- Check if any tournaments exist for TODAY (India Time)
SELECT 
    id, 
    name, 
    start_time, 
    status 
FROM public.tournaments 
WHERE start_time >= (now() AT TIME ZONE 'Asia/Kolkata')::date
ORDER BY start_time ASC;

-- Force a reload of the PostgREST schema cache
-- Run this in the Supabase SQL Editor to fix 'Could not find the table' errors

NOTIFY pgrst, 'reload schema';

-- CHECK_RLS_POLICIES.sql
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('tournaments', 'matches');

-- Also check if RLS is enabled on the tables
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('tournaments', 'matches');

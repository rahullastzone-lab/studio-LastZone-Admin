"use client";
import { createClient } from '@/lib/supabase/client';

async function checkRegistrations() {
    const supabase = createClient();

    console.log("Checking 'registrations' table...");
    const { count: regCount, error: regError } = await supabase.from('registrations').select('*', { count: 'exact', head: true });
    if (regError) console.error("Error 'registrations':", regError.message);
    else console.log("'registrations' count:", regCount);

    console.log("Checking 'match_registrations' table...");
    const { count: matchRegCount, error: matchRegError } = await supabase.from('match_registrations').select('*', { count: 'exact', head: true });
    if (matchRegError) console.error("Error 'match_registrations':", matchRegError.message);
    else console.log("'match_registrations' count:", matchRegCount);
}

checkRegistrations();

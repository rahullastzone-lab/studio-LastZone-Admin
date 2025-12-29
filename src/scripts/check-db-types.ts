
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkTypes() {
    console.log('Checking column types...');
    // We can't access information_schema easily via supabase-js client normally unless exposed.
    // Instead, let's try to infer from data or error.

    // Check tournaments ID type by fetching one
    const { data: tournaments, error: tError } = await supabase.from('tournaments').select('id').limit(1);
    if (tError) console.error('Error fetching tournaments:', tError);
    else if (tournaments && tournaments.length > 0) {
        console.log('Tournament ID example:', tournaments[0].id);
        console.log('Tournament ID seems to be:', typeof tournaments[0].id);
    } else {
        console.log('No tournaments found to check type.');
    }

    // Check profiles ID type
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1);
    if (pError) console.error('Error fetching profiles:', pError);
    else if (profiles && profiles.length > 0) {
        console.log('Profile ID example:', profiles[0].id);
        console.log('Profile ID seems to be:', typeof profiles[0].id);
    } else {
        console.log('No profiles found to check type.');
    }
}

checkTypes();

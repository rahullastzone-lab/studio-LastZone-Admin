
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRegistrations() {
    console.log("Checking for ANY non-empty player_details...");

    // Try to find ANY registration with content in player_details
    const { data, error } = await supabase
        .from('registrations')
        .select(`
      id,
      player_details,
      profiles ( username, email, phone )
    `)
        .neq('player_details', '{}')
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Found non-empty registrations:", data?.length);
    if (data && data.length > 0) {
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log("No registrations found with non-empty player_details.");
    }
}

debugRegistrations();

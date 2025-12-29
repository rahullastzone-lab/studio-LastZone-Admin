'use server';

import { createClient } from '@supabase/supabase-js';

export async function createUserAction(userData: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return {
            success: false,
            error: 'Server configuration error: Missing Supabase Admin Keys.'
        };
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        const { email, password, username } = userData;

        // Create user in Supabase Auth
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email since admin created it
            user_metadata: {
                username: username
            }
        });

        if (error) throw error;

        return { success: true, data };

    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to create user'
        };
    }
}

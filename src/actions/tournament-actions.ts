'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function closeTournament(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tournaments')
        .update({ status: 'Closed' })
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/tournaments');
    return { success: true };
}

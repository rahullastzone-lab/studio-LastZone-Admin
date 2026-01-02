'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createStream(data: any) {
    const supabase = await createClient();
    const { error } = await supabase.from('tournament_streams').insert(data);

    if (error) throw new Error(error.message);
    revalidatePath('/streams');
    return { success: true };
}

export async function updateStream(id: string, data: any) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('tournament_streams')
        .update(data)
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/streams');
    return { success: true };
}

export async function deleteStream(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('tournament_streams')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/streams');
    return { success: true };
}

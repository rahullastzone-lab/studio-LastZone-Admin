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

export async function updateRoomDetails(id: string, roomId: string, roomPass: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tournaments')
        .update({
            room_id: roomId,
            room_password: roomPass,
        })
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/tournaments');
    return { success: true };
}

export async function updateTournamentPrizes(
    id: string,
    prizes: { prize_1st: number, prize_2nd: number, prize_3rd: number, prize_4th: number, prize_5th: number }
) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tournaments')
        .update(prizes)
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/tournaments');
    return { success: true };
}

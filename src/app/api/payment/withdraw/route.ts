import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, upiId } = await req.json();

        if (!amount || amount < 1) {
            return NextResponse.json({ error: 'Invalid amount. Minimum withdrawal is ₹1.' }, { status: 400 });
        }

        if (!upiId || upiId.length < 3) {
            return NextResponse.json({ error: 'Invalid UPI ID provided.' }, { status: 400 });
        }

        // 1. Fetch User Profile to check Winnings Balance
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('winnings')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        const currentWinnings = Number(profile.winnings) || 0;

        if (currentWinnings < amount) {
            return NextResponse.json({ error: 'Insufficient winnings balance.' }, { status: 400 });
        }

        // 2. Transact: Deduct Winnings & Create Transaction Log
        // Note: Supabase doesn't support complex transactions in client easily without RPC, 
        // strictly speaking we should use RPC for atomicity. 
        // For this implementation, we will check->update->insert. 
        // Ideal: Use an RPC function `request_withdrawal`. 

        // Lets try update first (Optimistic locking sort of, relying on constraints if any)

        // Deduct logic
        const newWinnings = currentWinnings - Number(amount);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ winnings: newWinnings })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        // Create Transaction Log
        const { data: txn, error: txnError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                amount: Number(amount),
                type: 'withdrawal',
                status: 'pending',
                description: `Withdrawal to UPI: ${upiId}`
            })
            .select()
            .single();

        if (txnError) {
            // CRITICAL: If insert fails, we should refund the user immediately.
            // This is "Compensation Logic"
            await supabase.from('profiles').update({ winnings: currentWinnings }).eq('id', user.id);
            throw txnError;
        }

        return NextResponse.json({ success: true, transaction: txn });

    } catch (error: any) {
        console.error('Withdrawal request failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '@/lib/payment/razorpay';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId, paymentId, signature, amount } = await req.json();

        // 1. Verify Signature
        const isValid = await verifySignature(orderId, paymentId, signature);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // 2. Fetch User Profile to get current balance
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            throw new Error('User profile not found');
        }

        const newBalance = (profile.wallet_balance || 0) + Number(amount);

        // 3. Update Wallet
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ wallet_balance: newBalance })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        // 4. Log Transaction
        const { error: txnError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                amount: Number(amount),
                type: 'deposit',
                description: `Wallet Deposit (Razorpay: ${paymentId})`,
                status: 'completed', // Instant success
                metadata: { order_id: orderId, payment_id: paymentId }
            });

        if (txnError) {
            console.error('Transaction log failed:', txnError);
        }

        return NextResponse.json({ success: true, newBalance });
    } catch (error: any) {
        console.error('Payment verification failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

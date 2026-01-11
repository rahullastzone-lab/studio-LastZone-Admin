import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/payment/razorpay';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount } = await req.json();

        if (!amount || amount < 1) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const order = await createOrder(amount); // amount in INR

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';

// Helper to get keys from DB
async function getRazorpayKeys() {
    const supabase = await createClient();
    const { data } = await supabase.from('app_settings').select('*').in('setting_key', ['razorpay_key_id', 'razorpay_key_secret']);

    const keyId = data?.find(s => s.setting_key === 'razorpay_key_id')?.setting_value;
    const keySecret = data?.find(s => s.setting_key === 'razorpay_key_secret')?.setting_value;

    if (!keyId || !keySecret) {
        throw new Error('Razorpay keys are not configured in App Settings.');
    }

    return { keyId, keySecret };
}

export async function createOrder(amount: number, currency: string = 'INR') {
    const { keyId, keySecret } = await getRazorpayKeys();

    const instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });

    const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt: `receipt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);
    // @ts-ignore
    return { ...order, key_id: keyId }; // Return key_id for frontend use
}

export async function verifySignature(orderId: string, paymentId: string, signature: string) {
    const { keySecret } = await getRazorpayKeys();

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', keySecret);

    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest('hex');

    return generatedSignature === signature;
}

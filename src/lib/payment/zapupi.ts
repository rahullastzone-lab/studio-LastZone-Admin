import { createClient } from '@/lib/supabase/server';

// Helper to get ZapUPI keys from DB
export async function getZapUPIKeys() {
    const supabase = await createClient();
    const { data } = await supabase.from('app_settings').select('*').in('key', ['ZAPUPI_TOKEN_KEY', 'ZAPUPI_SECRET_KEY']);

    const token = data?.find(s => s.key === 'ZAPUPI_TOKEN_KEY')?.value;
    const secret = data?.find(s => s.key === 'ZAPUPI_SECRET_KEY')?.value;

    if (!token || !secret) {
        throw new Error('ZapUPI keys are not configured in App Settings.');
    }

    return { token, secret };
}

// Basic Order Creation stub
// You would replace this with actual ZapUPI API call
export async function createZapUPIOrder(amount: number) {
    const { token, secret } = await getZapUPIKeys();

    // Example logic (Replace with actual ZapUPI implementation)
    // const response = await fetch('https://zapupi.com/api/create-order', {
    //    headers: { 'Authorization': `Bearer ${token}` }
    // });

    // For now returning mock data to confirm keys are fetched
    return {
        orderId: `zap_${Date.now()}`,
        amount: amount,
        currency: 'INR',
        key: token // returning public token for frontend
    };
}

export async function verifyZapUPISignature(orderId: string, paymentId: string, signature: string) {
    const { secret } = await getZapUPIKeys();

    // Placeholder verification logic
    // Replace with actual HMAC or signature check provided by ZapUPI doc
    /*
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
    */

    // For now, return true to allow testing flow if exact logic unknown
    // WARN: This is insecure for production until actual logic implemented
    return true;
}

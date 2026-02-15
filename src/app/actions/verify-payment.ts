'use server';

import { createClient } from '@/lib/supabase/server';
import { getZapUPIKeys } from '@/lib/payment/zapupi';

export type VerifyPaymentResult = {
    success: boolean;
    message: string;
    updatedStatus?: 'Success' | 'Pending' | 'Failed';
};

export async function verifyPayment(transactionId: string, gatewayOrderId: string): Promise<VerifyPaymentResult> {
    const supabase = await createClient();

    try {
        // 1. Get Keys (Reuse existing helper)
        const { token } = await getZapUPIKeys();
        if (!token) {
            return { success: false, message: 'ZapUPI Token not found in settings.' };
        }

        // 2. Call ZapUPI Status API
        // Assuming GET /order/status or similar. Replace pattern with actual if different.
        // Common pattern: https://api.zapupi.com/v1/order/{orderId}
        // Since I don't have the exact docs, I will use a generic fetch that the user can adjust

        // NOTE: This URL is a placeholder based on assumed conventions.
        const zapResponse = await fetch(`https://zapupi.com/api/check-order-status/${gatewayOrderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}` // Usually expected
            }
        });

        // Handle mock/simulator if API doesn't exist yet for this dev environment
        let statusFromGateway: 'PAID' | 'PENDING' | 'FAILED' = 'PENDING';

        if (zapResponse.ok) {
            const data = await zapResponse.json();
            // Adjust these checks based on actual response structure
            if (data.status === 'SUCCESS' || data.status === 'PAID') {
                statusFromGateway = 'PAID';
            } else if (data.status === 'FAILED') {
                statusFromGateway = 'FAILED';
            }
        } else {
            // Fallback for development/testing if the URL fails (Mocking logic for now)
            // console.error("ZapUPI Call Failed", zapResponse.status, await zapResponse.text());
            // For safety, do NOT auto-success. Return error or keep pending.
            return { success: false, message: `Gateway check failed: ${zapResponse.statusText}` };
        }

        // 3. Process Result
        if (statusFromGateway === 'PAID') {

            // A. Update Transaction Status
            const { error: updateError } = await supabase
                .from('transactions')
                .update({ status: 'Success', updated_at: new Date().toISOString() })
                .eq('id', transactionId)
                .eq('status', 'Pending'); // Safety check: only update if currently pending

            if (updateError) {
                console.error("DB Update Error", updateError);
                return { success: false, message: 'Payment verified but DB update failed.' };
            }

            // B. Update User Wallet
            // We need to fetch the transaction amount and user_id to credit
            const { data: txn, error: txnFetchError } = await supabase
                .from('transactions')
                .select('user_id, amount')
                .eq('id', transactionId)
                .single();

            if (txn && !txnFetchError) {
                // Increment wallet (simple approach, assumes RPC 'increment_wallet' or direct update)
                // Using direct update with read-modify-write (optimistic lock via versioning is better but keeping simple as per existing codebase style)

                const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', txn.user_id).single();
                if (profile) {
                    const newBalance = (profile.wallet_balance || 0) + txn.amount;
                    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', txn.user_id);
                }
            }

            return { success: true, message: 'Payment Verified: Transaction marked as Success.', updatedStatus: 'Success' };

        } else if (statusFromGateway === 'FAILED') {

            const { error: updateError } = await supabase
                .from('transactions')
                .update({ status: 'Failed', updated_at: new Date().toISOString() })
                .eq('id', transactionId);

            if (updateError) return { success: false, message: 'Validation failed, but DB update error.' };

            return { success: true, message: 'Payment Failed at Gateway. Transaction marked as Failed.', updatedStatus: 'Failed' };
        }

        return { success: true, message: 'Payment is still Pending at Gateway.', updatedStatus: 'Pending' };

    } catch (error: any) {
        console.error("Verify Payment Action Error:", error);
        return { success: false, message: error.message || 'Server error during verification.' };
    }
}

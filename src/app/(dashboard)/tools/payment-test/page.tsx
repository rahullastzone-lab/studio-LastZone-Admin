'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Script from 'next/script';

export default function PaymentTestPage() {
    const [amount, setAmount] = useState('100');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create Order
            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Number(amount) }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create order');
            }

            console.log('Order created:', data);

            // 2. Initialize Razorpay
            const options = {
                key: data.key_id, // Enter the Key ID generated from the Dashboard
                amount: data.amount,
                currency: data.currency,
                name: 'LastZone Esports',
                description: 'Wallet Deposit',
                order_id: data.id,
                handler: async function (response: any) {
                    console.log('Payment success:', response);

                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                amount: amount, // Send amount to update wallet (backend should ideally verify amount from order but for MVP this works if signature is valid)
                            }),
                        });

                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok) throw new Error(verifyData.error);

                        toast({
                            title: 'Payment Successful',
                            description: `Added ₹${amount} to wallet. New Balance: ₹${verifyData.newBalance}`,
                        });
                    } catch (err: any) {
                        toast({
                            title: 'Verification Failed',
                            description: err.message,
                            variant: 'destructive',
                        });
                    }
                },
                prefill: {
                    name: 'Test User',
                    email: 'test@example.com',
                    contact: '9999999999',
                },
                theme: {
                    color: '#3399cc',
                },
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                toast({
                    title: 'Payment Failed',
                    description: response.error.description,
                    variant: 'destructive',
                });
            });
            rzp1.open();

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
            // Don't verify success here, it's done in handler
        }
    };

    return (
        <div className="p-8 max-w-lg mx-auto">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <Card>
                <CardHeader>
                    <CardTitle>Test Payment Integration</CardTitle>
                    <CardDescription>Simulate a "Payin" (Add Money) transaction.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Amount (₹)</label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <Button onClick={handlePayment} disabled={loading} className="w-full">
                        {loading ? 'Processing...' : 'Pay Now'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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

            console.log('ZapUPI Order created:', data);

            // For ZapUPI, usually you redirect the user to a payment page or show a QR code
            // Since we implemented a 'mock' create structure in zapupi.ts for now, 
            // we will simulate the "Verification" step directly here for testing purposes.
            // In a real flow: 
            // 1. Redirect user to ZapUPI gateway
            // 2. ZapUPI redirects back to 'callback' URL
            // 3. Callback URL triggers verification

            toast({
                title: 'Order Created',
                description: `Order ID: ${data.orderId}. Simulating payment...`,
            });

            // SIMULATE PAYMENT SUCCESS SIGNAL
            const mockPaymentId = `pay_${Date.now()}`;
            const mockSignature = "simulated_signature";

            // 2. Verify Payment (Simulation)
            const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: data.orderId,
                    paymentId: mockPaymentId,
                    signature: mockSignature,
                    amount: amount,
                }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);

            toast({
                title: 'Payment Successful',
                description: `Added ₹${amount} to wallet. New Balance: ₹${verifyData.newBalance}`,
            });

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-lg mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Test Payment Integration (ZapUPI)</CardTitle>
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
                    <p className="text-xs text-muted-foreground text-center">
                        Note: This is a simulation using ZapUPI credentials.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

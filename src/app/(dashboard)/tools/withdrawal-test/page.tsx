'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function WithdrawalTestPage() {
    const [amount, setAmount] = useState('50');
    const [upiId, setUpiId] = useState('test@upi');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleWithdrawal = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/payment/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(amount),
                    upiId: upiId
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to request withdrawal');
            }

            toast({
                title: 'Withdrawal Requested',
                description: `Request for ₹${amount} submitted successfully. Txn ID: ${data.transaction.id}`,
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
                    <CardTitle>Test Withdrawal Request</CardTitle>
                    <CardDescription>Simulate a User requesting a payout.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Amount (₹)</label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Note: Ensure your test user has sufficient "Winnings" balance.</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">UPI ID</label>
                        <Input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="user@upi"
                        />
                    </div>
                    <Button onClick={handleWithdrawal} disabled={loading} className="w-full">
                        {loading ? 'Processing...' : 'Request Withdrawal'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

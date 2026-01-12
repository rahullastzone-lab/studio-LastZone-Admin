'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, PlusCircle } from 'lucide-react';

export function AddFundsModal({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [amount, setAmount] = useState('');
    const { toast } = useToast();
    const supabase = createClient();

    const handleAddFunds = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast({
                title: "Invalid Input",
                description: "Please enter a valid User ID/Email and Amount.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Find User
            let userId = '';
            let currentBalance = 0;
            let userName = '';

            // Try searching by ID first (if valid UUID)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

            let query = supabase.from('profiles').select('id, wallet_balance, username, email');

            if (isUuid) {
                query = query.eq('id', identifier);
            } else {
                query = query.eq('email', identifier);
            }

            const { data: users, error: userError } = await query;

            if (userError) throw userError;

            if (!users || users.length === 0) {
                throw new Error("User not found via ID or Email.");
            }

            const user = users[0];
            userId = user.id;
            currentBalance = Number(user.wallet_balance) || 0;
            userName = user.username || user.email;

            const depositAmount = Number(amount);

            // 2. Update Balance
            const newBalance = currentBalance + depositAmount;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ wallet_balance: newBalance })
                .eq('id', userId);

            if (updateError) throw updateError;

            // 3. Log Transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: userId,
                    amount: depositAmount,
                    type: 'deposit',
                    status: 'completed',
                    description: 'Admin Manual Deposit'
                });

            if (txError) throw txError;

            toast({
                title: "Funds Added",
                description: `Successfully added ₹${depositAmount} to ${userName}'s wallet.`,
            });

            setOpen(false);
            setIdentifier('');
            setAmount('');
            onSuccess();

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to add funds.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Funds
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manual Deposit</DialogTitle>
                    <DialogDescription>
                        Add funds directly to a user's main wallet balance.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddFunds}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="identifier" className="text-right">
                                User
                            </Label>
                            <Input
                                id="identifier"
                                placeholder="Email or User ID"
                                className="col-span-3"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                className="col-span-3"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Funds
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

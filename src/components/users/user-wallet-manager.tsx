'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Wallet, Trophy, User as UserIcon, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type UserProfile = {
    id: string;
    username: string;
    email: string;
    wallet_balance: number; // Main Deposit
    winnings: number;
    bonus: number;
    avatar_url?: string;
    full_name?: string;
    created_at?: string;
    teammates?: {
        duo?: { name: string; uid: string }[];
        squad?: { name: string; uid: string }[];
    } | null;
};

const TeamViewModal = ({ user, isOpen, onClose }: { user: UserProfile | null, isOpen: boolean, onClose: (open: boolean) => void }) => {
    if (!user) return null;
    const teams = user.teammates || { duo: [], squad: [] };
    // Handle legacy array/null if necessary, though type says structured.
    // We'll safely access properties.
    const duoTeam = (teams as any).duo && Array.isArray((teams as any).duo) ? (teams as any).duo : [];
    const squadTeam = (teams as any).squad && Array.isArray((teams as any).squad) ? (teams as any).squad : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Team Details: {user.username}</DialogTitle>
                    <DialogDescription>View registered teammates for this user.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 md:grid-cols-2 mt-4">
                    {/* DUO TEAM */}
                    <div className="bg-secondary/20 p-4 rounded-lg border">
                        <h3 className="font-bold text-indigo-400 mb-3 flex items-center gap-2">
                            <UserIcon className="h-4 w-4" /> Duo Team
                        </h3>
                        {duoTeam.length > 0 ? (
                            <div className="space-y-2">
                                {duoTeam.map((t: any, i: number) => (
                                    <div key={i} className="bg-secondary/40 p-2 rounded flex justify-between text-sm items-center">
                                        <span className="font-medium">{t.name}</span>
                                        <span className="text-xs text-muted-foreground font-mono bg-background/50 px-1 py-0.5 rounded">{t.uid || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm italic">No Duo team found.</p>
                        )}
                    </div>
                    {/* SQUAD TEAM */}
                    <div className="bg-secondary/20 p-4 rounded-lg border">
                        <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                            <UserIcon className="h-4 w-4" /> Squad Team
                        </h3>
                        {squadTeam.length > 0 ? (
                            <div className="space-y-2">
                                {squadTeam.map((t: any, i: number) => (
                                    <div key={i} className="bg-secondary/40 p-2 rounded flex justify-between text-sm items-center">
                                        <span className="font-medium">{t.name}</span>
                                        <span className="text-xs text-muted-foreground font-mono bg-background/50 px-1 py-0.5 rounded">{t.uid || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm italic">No Squad team found.</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onClose(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function UserWalletManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [manageType, setManageType] = useState<'wallet_balance' | 'winnings' | 'bonus' | 'refund'>('refund');
    const [actionType, setActionType] = useState<'add' | 'deduct'>('add');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    // Team View State
    const [teamViewUser, setTeamViewUser] = useState<UserProfile | null>(null);
    const [isTeamViewOpen, setIsTeamViewOpen] = useState(false);

    const { toast } = useToast();
    const supabase = createClient();

    const fetchRecentUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            if (data) {
                setUsers(data.map(u => ({
                    id: u.id,
                    username: u.username || 'Unknown',
                    email: u.email || 'No Email',
                    wallet_balance: u.wallet_balance || 0,
                    winnings: u.winnings || 0,
                    bonus: u.bonus || 0,
                    avatar_url: u.avatar_url,
                    full_name: u.full_name,
                    created_at: u.created_at,
                    teammates: u.teammates
                })));
            }
        } catch (error: any) {
            toast({
                title: "Error fetching users",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // Fetch on mount
    useEffect(() => {
        fetchRecentUsers();
    }, [fetchRecentUsers]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchRecentUsers();
            return;
        }
        setLoading(true);

        try {
            let query = supabase.from('profiles').select('*');

            // Check if input looks like a UUID (8-4-4-4-12 hex digits)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery);

            if (isUuid) {
                query = query.eq('id', searchQuery);
            } else {
                // Search username or email (case-insensitive for better UX)
                query = query.or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query.limit(20); // allow multiple results

            if (error) throw error;

            if (data) {
                setUsers(data.map(u => ({
                    id: u.id,
                    username: u.username || 'Unknown',
                    email: u.email || 'No Email',
                    wallet_balance: u.wallet_balance || 0,
                    winnings: u.winnings || 0,
                    bonus: u.bonus || 0,
                    avatar_url: u.avatar_url,
                    full_name: u.full_name,
                    created_at: u.created_at,
                    teammates: u.teammates
                })));
            }
        } catch (error: any) {
            toast({
                title: "Search Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const openManageDialog = (user: UserProfile, type: 'wallet_balance' | 'winnings' | 'bonus' | 'refund' = 'refund') => {
        setSelectedUser(user);
        setManageType(type);
        setAmount('');
        setReason('');
        setActionType('add');
        setIsManageOpen(true);
    };

    const handleUpdateWallet = async () => {
        if (!selectedUser || !amount || !reason) {
            toast({ title: 'Missing Fields', description: 'Please enter amount and reason.', variant: 'destructive' });
            return;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast({ title: 'Invalid Amount', description: 'Amount must be positive.', variant: 'destructive' });
            return;
        }

        setSubmitLoading(true);

        try {
            // Determine the actual column name in the database/profile object
            const columnToUpdate = manageType === 'refund' ? 'wallet_balance' : manageType;

            // Safe access using the mapped key
            const currentVal = selectedUser[columnToUpdate] || 0;
            let newVal = currentVal;

            if (actionType === 'add') {
                newVal += numAmount;
            } else {
                if (currentVal < numAmount) {
                    toast({ title: 'Insufficient Funds', description: `User only has ${currentVal} in this wallet.`, variant: 'destructive' });
                    setSubmitLoading(false);
                    return;
                }
                newVal -= numAmount;
            }

            const updateData = { [columnToUpdate]: newVal };
            const { error: updateError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', selectedUser.id);

            if (updateError) throw updateError;

            // 2. Log Transaction
            const { error: txnError } = await supabase
                .from('transactions')
                .insert({
                    user_id: selectedUser.id,
                    amount: numAmount,
                    type: manageType === 'refund' ? 'refund' : (actionType === 'add' ? 'admin_credit' : 'admin_debit'),
                    description: `Admin Adjustment (${manageType}): ${reason} - ${actionType === 'add' ? 'Added' : 'Deducted'} ${numAmount}`,
                    status: 'completed'
                });

            if (txnError) {
                console.error('Transaction log error details:', JSON.stringify(txnError, null, 2));
                // Don't block UI but alert
                toast({
                    title: 'Transaction Log Failed',
                    description: 'Wallet updated but transaction history not saved (RLS Permission).',
                    variant: 'destructive',
                });
            }

            toast({
                title: 'Wallet Updated',
                description: `Successfully ${actionType === 'add' ? 'added' : 'deducted'} ${numAmount} from ${manageType}.`
            });

            // Update local state in the list
            setUsers(prev => prev.map(u =>
                u.id === selectedUser.id ? { ...u, [columnToUpdate]: newVal } : u
            ));

            setIsManageOpen(false);
            setSelectedUser(null);

        } catch (error: any) {
            toast({
                title: "Update Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSubmitLoading(false);
        }
    };

    const getWalletLabel = (type: string) => {
        if (type === 'wallet_balance') return 'Main Balance (Deposit)';
        if (type === 'winnings') return 'Winnings (Withdrawable)';
        if (type === 'bonus') return 'Bonus Cash';
        return type;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>User Wallet Manager</CardTitle>
                    <CardDescription>View recent users or search to manage funds.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Username, Email, or User ID..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? 'Searching...' : 'Search User'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">User Info</TableHead>
                                <TableHead>Total Balance</TableHead>
                                <TableHead>Winnings</TableHead>
                                <TableHead>Bonus</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <RefreshCw className="h-4 w-4 animate-spin" /> Loading data...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                                                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{user.username}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">
                                        <div title={`Wallet: ${user.wallet_balance} | Win: ${user.winnings} | Bonus: ${user.bonus}`}>
                                            <span className="font-bold text-green-400">
                                                ₹{((user.wallet_balance || 0) + (user.winnings || 0) + (user.bonus || 0)).toFixed(2)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-yellow-600">
                                        ₹{user.winnings.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="font-mono text-blue-600">
                                        ₹{user.bonus.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openManageDialog(user)}
                                        >
                                            <Wallet className="mr-2 h-3 w-3" />
                                            Manage Wallet
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="ml-1"
                                            onClick={() => {
                                                setTeamViewUser(user);
                                                setIsTeamViewOpen(true);
                                            }}
                                            title="View Team"
                                        >
                                            <Users className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Manage Dialog */}
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Wallet</DialogTitle>
                        <DialogDescription>
                            Updating funds for <b>{selectedUser?.username}</b>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Wallet Type</Label>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    type="button"
                                    variant={manageType === 'refund' ? 'default' : 'outline'}
                                    onClick={() => setManageType('refund')}
                                    className={manageType === 'refund' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    Refund
                                </Button>
                                <Button
                                    size="sm"
                                    type="button"
                                    variant={manageType === 'winnings' ? 'default' : 'outline'}
                                    onClick={() => setManageType('winnings')}
                                    className={manageType === 'winnings' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                                >
                                    Winnings
                                </Button>
                                <Button
                                    size="sm"
                                    type="button"
                                    variant={manageType === 'bonus' ? 'default' : 'outline'}
                                    onClick={() => setManageType('bonus')}
                                    className={manageType === 'bonus' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                                >
                                    Bonus
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label>Action Type</Label>
                            <RadioGroup value={actionType} onValueChange={(v: any) => setActionType(v)} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="add" id="r-add" />
                                    <Label htmlFor="r-add" className="cursor-pointer font-medium text-green-600">Credit (+ Add)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="deduct" id="r-deduct" />
                                    <Label htmlFor="r-deduct" className="cursor-pointer font-medium text-red-600">Debit (- Deduct)</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason / Admin Note</Label>
                            <Input
                                id="reason"
                                placeholder="e.g. Added signup bonus manually"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsManageOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateWallet} disabled={submitLoading} variant={actionType === 'deduct' ? 'destructive' : 'default'}>
                            {submitLoading ? 'Processing...' : 'Confirm Update'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Team View Modal */}
            <TeamViewModal
                user={teamViewUser}
                isOpen={isTeamViewOpen}
                onClose={setIsTeamViewOpen}
            />
        </div>
    );
}

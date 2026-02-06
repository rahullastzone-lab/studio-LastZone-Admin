'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { columns as columnDef } from './columns';
import { DataTable } from './data-table';
import { type User } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserWalletManager } from '@/components/users/user-wallet-manager';
import { createUserAction } from '@/actions/create-user';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const [moneyModalUser, setMoneyModalUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '' });

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive"
      });
    } else if (data) {
      const mappedUsers: User[] = data.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        phone: u.phone, // Legacy field
        mobileNumber: u.mobile_number, // New field
        referralCode: u.referral_code, // New field
        avatarUrl: u.avatar_url,
        walletBalance: u.wallet_balance || 0,
        isAdmin: u.is_admin,
        status: u.status,
        instagram_link: u.instagram_link,
        youtube_link: u.youtube_link,
      }));
      setUsers(mappedUsers);
    }
    setIsLoading(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast({ title: "Missing Fields", description: "All fields are required.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createUserAction(newUser);

      if (result.success) {
        toast({ title: "User Created", description: `User ${newUser.username} has been created.` });
        setIsAddUserOpen(false);
        setNewUser({ username: '', email: '', password: '' });
        fetchUsers(); // Refresh the list
      } else {
        toast({ title: "Creation Failed", description: result.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleBanToggle = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const newStatus = userToUpdate.status === 'Active' ? 'Banned' : 'Active';

    // Optimistic Update
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );

    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) {
      // Revert on error
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, status: userToUpdate.status } : user
        )
      );
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: `User ${newStatus}`,
        description: `${userToUpdate.username} has been ${newStatus.toLowerCase()}.`,
      });
    }
  };

  const handleOpenMoneyDialog = (user: User) => {
    setMoneyModalUser(user);
    setAmount(0);
  };

  const handleWalletUpdate = async () => {
    if (!moneyModalUser) return;

    const newBalance = moneyModalUser.walletBalance + amount;

    // Optimistic UI Update
    setUsers(users.map(u =>
      u.id === moneyModalUser.id
        ? { ...u, walletBalance: newBalance }
        : u
    ));

    // Update DB
    const { error } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', moneyModalUser.id);

    if (error) {
      // Revert
      setUsers(users.map(u =>
        u.id === moneyModalUser.id
          ? { ...u, walletBalance: moneyModalUser.walletBalance }
          : u
      ));
      toast({
        title: "Error updating wallet",
        description: error.message,
        variant: "destructive"
      });
    } else {
      // Also log transaction
      await supabase.from('transactions').insert({
        user_id: moneyModalUser.id,
        username: moneyModalUser.username, // Assuming we want redundancy for display
        amount: Math.abs(amount),
        type: amount > 0 ? 'Deposit' : 'Withdrawal', // Or 'Bonus' / 'Penalty'
        status: 'Success',
        description: 'Admin Manual Adjustment'
      });

      toast({
        title: "Wallet Updated",
        description: `₹${Math.abs(amount)} has been ${amount > 0 ? 'added to' : 'deducted from'} ${moneyModalUser.username}'s wallet.`,
      });
    }

    setMoneyModalUser(null);
  };


  const columns = columnDef({
    onBanToggle: handleBanToggle,
    onMoneyAction: handleOpenMoneyDialog,
    onViewDetails: (user) => setViewUser(user)
  });

  if (isLoading && users.length === 0) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="User Management"
          description="View and manage all platform users."
          onRefresh={fetchUsers}
        />
        <Button onClick={() => setIsAddUserOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="list">User List</TabsTrigger>
          <TabsTrigger value="wallet">Advanced Wallet Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 pt-4">
          <DataTable columns={columns} data={users} searchKey="username" />
        </TabsContent>

        <TabsContent value="wallet" className="pt-4">
          <UserWalletManager />
        </TabsContent>
      </Tabs>

      {/* Money Dialog */}
      <Dialog open={!!moneyModalUser} onOpenChange={(isOpen) => !isOpen && setMoneyModalUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add/Deduct Money for {moneyModalUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="col-span-3"
                placeholder="Use - for deduction"
              />
            </div>
            <div className="text-sm text-muted-foreground col-span-4 text-right pr-4">
              Current Balance: ₹{moneyModalUser?.walletBalance.toFixed(2)}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleWalletUpdate}>Update Wallet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(isOpen) => !isOpen && setViewUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center text-xl font-bold">
                  {viewUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{viewUser.username}</h3>
                  <p className="text-sm text-muted-foreground">{viewUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Mobile Number</span>
                  <p className="text-sm font-semibold">{viewUser.mobileNumber || viewUser.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Referral Code</span>
                  <p className="text-sm font-semibold">{viewUser.referralCode || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Wallet Balance</span>
                  <p className="text-sm font-semibold">₹{viewUser.walletBalance.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <p className="text-sm font-semibold">{viewUser.status}</p>
                </div>
                {viewUser.instagram_link && (
                  <div className="space-y-1 col-span-2">
                    <span className="text-sm font-medium text-muted-foreground">Instagram</span>
                    <p className="text-sm truncate"><a href={viewUser.instagram_link} target="_blank" className="text-blue-500 hover:underline">{viewUser.instagram_link}</a></p>
                  </div>
                )}
                {viewUser.youtube_link && (
                  <div className="space-y-1 col-span-2">
                    <span className="text-sm font-medium text-muted-foreground">YouTube</span>
                    <p className="text-sm truncate"><a href={viewUser.youtube_link} target="_blank" className="text-blue-500 hover:underline">{viewUser.youtube_link}</a></p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewUser(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

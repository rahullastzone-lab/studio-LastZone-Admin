'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import React from 'react';
import { createClient } from '@/lib/supabase/client';

// Define type based on transactions table structure
type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  created_at: string;
  profiles?: {
    username: string;
    email: string;
  };
};

export default function WithdrawalRequests({ onRefresh }: { onRefresh: () => void }) {
  const { toast } = useToast();
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const { data: withdrawals, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:user_id (
            username,
            email
          )
        `)
        .eq('type', 'withdrawal')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(withdrawals || []);
    } catch (error: any) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch withdrawal requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []); // Initial load

  // Re-fetch when onRefresh is triggered from parent if needed, 
  // but this component fetches its own data now for better control.
  // We can expose a refresh method if needed.

  const handleAction = async (
    action: 'Approved' | 'Rejected',
    transaction: Transaction
  ) => {
    try {
      if (action === 'Approved') {
        const { error } = await supabase
          .from('transactions')
          .update({ status: 'completed' }) // Using lowercase as per requirement
          .eq('id', transaction.id);

        if (error) throw error;
      } else {
        // Rejected logic: Refund to Winnings
        console.log('Rejecting and Refunding...', transaction);

        // 1. Update Transaction Status to 'failed'
        const { error: txError } = await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('id', transaction.id);

        if (txError) throw txError;

        // 2. Refund to User's Winnings Balance
        // We need to fetch current winnings first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('winnings')
          .eq('id', transaction.user_id)
          .single();

        if (profileError) throw profileError;

        const currentWinnings = Number(profile?.winnings) || 0;
        const refundAmount = Number(transaction.amount);
        const newWinnings = currentWinnings + refundAmount;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ winnings: newWinnings })
          .eq('id', transaction.user_id);

        if (updateError) throw updateError;

        // 3. Log Refund Transaction (Optional but good for audit)
        // Since the original was marked failed, we might want a new 'refund' entry
        // OR just keeping the original as 'failed' implies money wasn't taken out effectively?
        // Requirement says: "REFUND: Update profiles: winnings = winnings + Amount"
        // It doesn't explicitly say create a NEW transaction log for the refund, 
        // but usually good practice. However, simply marking the withdrawal as 'failed' 
        // and fixing the balance is often enough logic for "reversing" the action.
        // Let's stick to the requirement: Update status='failed', Update profiles.
      }

      toast({
        title: `Request ${action}`,
        description: `Withdrawal request for ₹${transaction.amount} has been ${action === 'Approved' ? 'approved' : 'rejected (refunded)'}.`,
      });

      // Refresh local data
      fetchWithdrawals();

      // Refresh parent if needed (e.g. stats)
      onRefresh();

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      accessorKey: 'username',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.profiles?.username || 'Unknown'}</span>
          <span className="text-xs text-muted-foreground">{row.original.profiles?.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(row.original.amount),
    },
    {
      accessorKey: 'description',
      header: 'Details',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-muted-foreground" title={row.original.description}>
          {row.original.description || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status?.toLowerCase();
        let color = 'text-yellow-500';
        if (status === 'completed') color = 'text-green-500';
        if (status === 'failed') color = 'text-red-500';

        return <div className={`capitalize font-medium ${color}`}>{status}</div>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const transaction = row.original;
        const isPending = transaction.status?.toLowerCase() === 'pending';

        if (!isPending) return null;

        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleAction('Approved', transaction)}
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction('Rejected', transaction)}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Requests</CardTitle>
        <CardDescription>
          Review and process user withdrawal requests using Transactions table.
        </CardDescription>
        <div className='flex justify-end'>
          <Button size="sm" variant="outline" onClick={fetchWithdrawals} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {loading ? "Loading requests..." : "No withdrawal requests found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

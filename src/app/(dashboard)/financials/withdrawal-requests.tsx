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

  const handleAction = async (
    action: 'Approved' | 'Rejected',
    transaction: Transaction
  ) => {
    try {
      if (action === 'Approved') {
        const { data: updatedTx, error } = await supabase
          .from('transactions')
          .update({ status: 'success' })
          .eq('id', transaction.id)
          .select();

        console.log('Approved Update Result:', { updatedTx, error });

        if (error) throw error;
      } else {
        // Rejected logic: Refund to Winnings
        console.log('Rejecting and Refunding...', transaction);

        // 1. Update Original Transaction Status to 'refund'
        const { data: updatedTx, error: txError } = await supabase
          .from('transactions')
          .update({ status: 'refund' })
          .eq('id', transaction.id)
          .select();

        console.log('Rejected Update Result:', { updatedTx, txError });

        if (txError) throw txError;

        // 2. Create a NEW Transaction for the Refund (Credit)
        const creditAmount = Math.abs(Number(transaction.amount));

        const { error: refundTxError } = await supabase
          .from('transactions')
          .insert({
            user_id: transaction.user_id,
            amount: creditAmount,
            type: 'Winnings', // Changed to Winnings to ensure positive display
            status: 'success',
            description: `Refund for withdrawal`
          });

        if (refundTxError) throw refundTxError;

        // 3. Refund to User's Winnings Balance
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('winnings')
          .eq('id', transaction.user_id)
          .single();

        if (profileError) throw profileError;

        const currentWinnings = Number(profile?.winnings) || 0;
        const newWinnings = currentWinnings + creditAmount;

        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ winnings: newWinnings })
          .eq('id', transaction.user_id)
          .select();

        console.log('Profile Refund Update Result:', { updatedProfile, updateError });

        if (updateError) throw updateError;
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
        <div className="text-muted-foreground" title={row.original.description}>
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
        if (status === 'completed' || status === 'success') color = 'text-green-500';
        if (status === 'failed' || status === 'refund') color = 'text-red-500';

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

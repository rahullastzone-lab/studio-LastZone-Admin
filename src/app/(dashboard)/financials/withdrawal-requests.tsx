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
import type { Withdrawal } from '@/lib/data';
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

export default function WithdrawalRequests({ data, onRefresh }: { data: Withdrawal[], onRefresh: () => void }) {
  const { toast } = useToast();
  // Filter only pending requests for display
  const [requests, setRequests] = useState(data.filter(d => d.status === 'Pending'));
  const supabase = createClient();

  useEffect(() => {
    setRequests(data.filter(d => d.status === 'Pending'));
  }, [data]);

  const handleAction = async (
    action: 'Approved' | 'Rejected',
    id: string,
    amount: number,
    username: string,
    userId: string // We need user_id for refund
  ) => {
    try {
      if (action === 'Approved') {
        const { error } = await supabase
          .from('withdrawals')
          .update({ status: 'Approved' })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Rejected logic: Refund
        const { error: wdError } = await supabase
          .from('withdrawals')
          .update({ status: 'Rejected' })
          .eq('id', id);

        if (wdError) throw wdError;

        // Refund to wallet
        // First fetch current balance to be safe or use increment rpc if available? 
        // Supabase doesn't have direct increment without function unless we use raw sql or fetch-update.
        // Simplified fetch-update for now.
        const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
        if (profile) {
          const newBalance = (profile.wallet_balance || 0) + amount;
          await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', userId);

          // Add Refund Transaction Log
          await supabase.from('transactions').insert({
            user_id: userId,
            username: username,
            amount: amount,
            type: 'Refund',
            status: 'Success',
            description: `Withdrawal Rejected: ${id}`
          });
        }
      }

      toast({
        title: `Request ${action}`,
        description: `${username}'s withdrawal request for ₹${amount} has been ${action.toLowerCase()}.`,
      });

      // Optimistic UI Update
      setRequests((prev) => prev.filter((r) => r.id !== id));

      // Refresh global data
      onRefresh();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const columns: ColumnDef<Withdrawal>[] = [
    {
      accessorKey: 'username',
      header: 'User',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.username}</div>
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
      accessorKey: 'upi_id',
      header: 'UPI ID',
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.upi_id}</div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const withdrawal = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                handleAction(
                  'Approved',
                  withdrawal.id,
                  withdrawal.amount,
                  withdrawal.username,
                  withdrawal.user_id
                )
              }
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                handleAction(
                  'Rejected',
                  withdrawal.id,
                  withdrawal.amount,
                  withdrawal.username,
                  withdrawal.user_id
                )
              }
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: requests,
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
        <CardTitle>Pending Withdrawals</CardTitle>
        <CardDescription>
          Review and process user withdrawal requests.
        </CardDescription>
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
                    No pending withdrawal requests.
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

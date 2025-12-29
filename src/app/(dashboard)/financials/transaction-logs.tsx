'use client';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
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
import { Input } from '@/components/ui/input';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Transaction } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import ClientDate from '@/components/ui/client-date';
import { ArrowUpDown } from 'lucide-react';

const statusVariant: {
  [key in Transaction['status']]: 'default' | 'secondary' | 'destructive';
} = {
  Success: 'default',
  Pending: 'secondary',
  Failed: 'destructive',
};

const typeVariant: {
  [key in Transaction['type']]: 'default' | 'secondary' | 'outline';
} = {
  Deposit: 'default',
  Winnings: 'default',
  Withdrawal: 'secondary',
  'Entry Fee': 'secondary',
  Refund: 'outline',
};

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'username',
    header: 'User',
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
      return (
        <div
          className={
            amount > 0
              ? 'text-green-500'
              : amount < 0
              ? 'text-red-500'
              : ''
          }
        >
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as Transaction['type'];
      return <Badge variant={typeVariant[type]}>{type}</Badge>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => {
      return <ClientDate date={row.getValue('created_at')} formatString="PPpp" />;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Transaction['status'];
      return <Badge variant={statusVariant[status]}>{status}</Badge>;
    },
  },
];

export default function TransactionLogs({ data }: { data: Transaction[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
     initialState: {
      pagination: {
        pageSize: 100,
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Transactions</CardTitle>
        <CardDescription>A complete log of all money flow.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row md:items-center py-4">
          <Input
            placeholder="Search by username..."
            value={
              (table.getColumn('username')?.getFilterValue() as string) ?? ''
            }
            onChange={(event) =>
              table.getColumn('username')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <div className="flex gap-2">
            <Select
              onValueChange={(value) =>
                value === 'all'
                  ? table.getColumn('type')?.setFilterValue(undefined)
                  : table.getColumn('type')?.setFilterValue(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Deposit">Deposit</SelectItem>
                <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                <SelectItem value="Refund">Refund</SelectItem>
                <SelectItem value="Winnings">Winnings</SelectItem>
                <SelectItem value="Entry Fee">Entry Fee</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) =>
                value === 'all'
                  ? table.getColumn('status')?.setFilterValue(undefined)
                  : table.getColumn('status')?.setFilterValue(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Success">Success</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
                    className="h-24 text-center"
                  >
                    No results.
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

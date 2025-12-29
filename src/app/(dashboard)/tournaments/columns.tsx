'use client';

import { type ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Pencil, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Tournament as TournamentType } from '@/lib/data';
import ClientDate from '@/components/ui/client-date';

export type Tournament = TournamentType;

const statusVariant: {
  [key in Tournament['status']]: 'default' | 'secondary' | 'destructive';
} = {
  Open: 'default',
  Closed: 'secondary',
  Completed: 'destructive',
};

export const columns: ColumnDef<Tournament>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'game_type',
    header: 'Game',
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
  },
  {
    accessorKey: 'entry_fee',
    header: 'Entry Fee',
    filterFn: 'fee',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('entry_fee'));
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);

      return <div className="font-medium">{amount === 0 ? "Free" : formatted}</div>;
    },
  },
  {
    accessorKey: 'prize_pool',
    header: 'Prize Pool',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('prize_pool'));
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'start_time',
    header: 'Start Time',
    cell: ({ row }) => {
        return <ClientDate date={row.getValue('start_time')} formatString="PPpp" />;
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Tournament['status'];
      return <Badge variant={statusVariant[status]}>{status}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const tournament = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(tournament.id)}
            >
              Copy Tournament ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Update Room ID/Pass
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href={`/tournaments/result-entry/${tournament.id}`}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Manage Results
                </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Tournament as TournamentType } from '@/lib/data';
import ClientDate from '@/components/ui/client-date';
import { TournamentActions } from './tournament-actions';

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
    cell: ({ row }) => <TournamentActions tournament={row.original} />,
  },
];

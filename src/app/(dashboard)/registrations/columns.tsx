'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { NotificationSubscription } from '@/lib/data';
import ClientDate from '@/components/ui/client-date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

export const columns: ColumnDef<NotificationSubscription>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'whatsappNumber',
    header: 'WhatsApp Number',
  },
  {
    accessorKey: 'interest',
    header: 'Interested In',
     cell: ({ row }) => {
      return <Badge variant="secondary">{row.getValue('interest')}</Badge>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <ClientDate date={row.getValue('createdAt')} formatString="PP" />;
    },
  },
];

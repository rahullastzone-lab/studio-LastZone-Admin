'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { NotificationSubscription } from '@/lib/data';
import ClientDate from '@/components/ui/client-date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

import { format } from 'date-fns';

export const columns: ColumnDef<NotificationSubscription>[] = [
  {
    accessorKey: 'interest', // Category
    header: 'Game Interest',
    cell: ({ row }) => {
      return <Badge variant="outline">{row.getValue('interest')}</Badge>;
    },
  },
  {
    accessorKey: 'whatsappNumber',
    header: 'WhatsApp Number',
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return (
        <div className="flex flex-col">
          <span className="font-medium">{format(date, 'dd/MM/yyyy')}</span>
          <span className="text-xs text-muted-foreground">{format(date, 'HH:mm')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'serviceName', // Specific Service
    header: 'Service Type/Name',
    cell: ({ row }) => {
      const val = row.getValue('serviceName') || row.getValue('interest') || 'Unknown';
      return <Badge variant="secondary">{String(val)}</Badge>;
    },
  },
];

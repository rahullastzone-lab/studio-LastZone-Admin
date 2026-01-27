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
import {
  ArrowUpDown,
  MoreHorizontal,
  Ban,
  PlusCircle,
  CheckCircle,
  Instagram,
  Youtube,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { User as UserType } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export type User = UserType;

type ColumnProps = {
  onBanToggle: (userId: string) => void;
  onMoneyAction: (user: User) => void;
};

const statusVariant: {
  [key: string]: 'outline' | 'destructive';
} = {
  Active: 'outline',
  Banned: 'destructive',
};

export const columns = ({ onBanToggle, onMoneyAction }: ColumnProps): ColumnDef<User>[] => [
  {
    accessorKey: 'username',
    header: 'User',
    cell: ({ row }) => {
      const user = row.original;
      const avatar = PlaceHolderImages.find((p) => p.id === user.avatarUrl);
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={avatar?.imageUrl}
              alt={user.username}
              data-ai-hint={avatar?.imageHint}
            />
            <AvatarFallback>{(user.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.username}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <div className="flex gap-1 mt-1">
              {user.instagram_link && (
                <a
                  href={user.instagram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-700 hover:scale-110 transition-transform"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {user.youtube_link && (
                <a
                  href={user.youtube_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-700 hover:scale-110 transition-transform"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'isAdmin',
    header: 'Role',
    cell: ({ row }) => {
      const isAdmin = row.original.isAdmin;
      return (
        <Badge variant={isAdmin ? 'default' : 'secondary'}>
          {isAdmin ? 'Admin' : 'User'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'walletBalance',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Wallet Balance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const balance = row.getValue('walletBalance');
      const amount = typeof balance === 'string' ? parseFloat(balance) : Number(balance || 0);

      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = (row.getValue('status') as User['status']) || 'Active';
      return <Badge variant={statusVariant[status]}>{status}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;

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
            <DropdownMenuItem onClick={() => onMoneyAction(user)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add/Deduct Money
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onBanToggle(user.id)}
              className={
                user.status !== 'Active'
                  ? ''
                  : 'text-destructive focus:bg-destructive/10 focus:text-destructive'
              }
            >
              {user.status === 'Active' ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  <span>Ban User</span>
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Unban User</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

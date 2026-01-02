'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash, Play, Square } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import ClientDate from '@/components/ui/client-date';
import { deleteStream, updateStream } from '@/actions/stream-actions';
import { StreamForm } from '@/components/streams/stream-form';

export type Stream = {
    id: string;
    tournament_id: string;
    youtube_url: string;
    start_time: string;
    end_time: string | null;
    status: 'Scheduled' | 'Live' | 'Ended';
    tournaments: {
        name: string;
    }
};

const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this stream?")) {
        await deleteStream(id);
    }
}

export const columns: ColumnDef<Stream>[] = [
    {
        accessorKey: 'tournaments.name',
        header: 'Tournament',
        cell: ({ row }) => row.original.tournaments?.name || 'Unknown',
    },
    {
        accessorKey: 'youtube_url',
        header: 'YouTube Link',
        cell: ({ row }) => (
            <a
                href={row.getValue('youtube_url')}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline max-w-[200px] truncate block"
            >
                {row.getValue('youtube_url')}
            </a>
        ),
    },
    {
        accessorKey: 'start_time',
        header: 'Start Time',
        cell: ({ row }) => <ClientDate date={row.getValue('start_time')} formatString="PP p" />,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string;
            return (
                <Badge
                    variant={
                        status === 'Live'
                            ? 'destructive'
                            : status === 'Ended'
                                ? 'secondary'
                                : 'default'
                    }
                >
                    {status}
                </Badge>
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const stream = row.original;

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
                        {stream.status === 'Scheduled' && (
                            <DropdownMenuItem onClick={() => updateStream(stream.id, { status: 'Live' })}>
                                <Play className="mr-2 h-4 w-4 text-green-500" /> Go Live
                            </DropdownMenuItem>
                        )}
                        {stream.status === 'Live' && (
                            <DropdownMenuItem onClick={() => updateStream(stream.id, { status: 'Ended' })} className="text-red-500">
                                <Square className="mr-2 h-4 w-4 fill-current" /> End Stream
                            </DropdownMenuItem>
                        )}
                        <StreamForm stream={stream} trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                        } />
                        <DropdownMenuItem onClick={() => handleDelete(stream.id)} className="text-red-500 focus:text-red-500">
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

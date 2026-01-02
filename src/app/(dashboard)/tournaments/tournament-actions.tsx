'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, ClipboardList, Ban } from 'lucide-react';
import Link from 'next/link';
import { closeTournament } from '@/actions/tournament-actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface TournamentActionsProps {
    tournament: any;
}

export function TournamentActions({ tournament }: TournamentActionsProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleClose = async () => {
        if (!confirm('Are you sure you want to close this tournament? This cannot be undone.')) return;

        setLoading(true);
        try {
            await closeTournament(tournament.id);
            toast({
                title: 'Success',
                description: 'Tournament closed successfully',
            });
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
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
                {tournament.status === 'Open' && (
                    <DropdownMenuItem onClick={handleClose} className="text-destructive focus:text-destructive">
                        <Ban className="mr-2 h-4 w-4" />
                        Close Tournament
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

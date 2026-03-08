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
import { UpdateRoomIdModal } from '@/components/tournaments/update-room-id-modal';
import { UpdatePrizesModal } from '@/components/tournaments/update-prizes-modal';

interface TournamentActionsProps {
    tournament: any;
}

export function TournamentActions({ tournament }: TournamentActionsProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showUpdateRoomModal, setShowUpdateRoomModal] = useState(false);
    const [showUpdatePrizesModal, setShowUpdatePrizesModal] = useState(false);

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
        <>
            <UpdateRoomIdModal
                isOpen={showUpdateRoomModal}
                onClose={() => setShowUpdateRoomModal(false)}
                tournamentId={tournament.id}
                existingRoomId={tournament.room_id}
                existingRoomPass={tournament.room_password}
            />
            <UpdatePrizesModal
                isOpen={showUpdatePrizesModal}
                onClose={() => setShowUpdatePrizesModal(false)}
                tournamentId={tournament.id}
                existingPrizes={{
                    prize_1st: tournament.prize_1st,
                    prize_2nd: tournament.prize_2nd,
                    prize_3rd: tournament.prize_3rd,
                    prize_4th: tournament.prize_4th,
                    prize_5th: tournament.prize_5th,
                }}
            />
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
                        onClick={() => {
                            navigator.clipboard.writeText(tournament.id);
                            toast({ title: "Copied!", description: "Tournament ID copied to clipboard." });
                        }}
                    >
                        Copy Tournament ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setShowUpdateRoomModal(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Update Room ID/Pass
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setShowUpdatePrizesModal(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Update Prizes
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/tournaments/result-entry/${tournament.id}`}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Manage Results
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/registrations?tournament_id=${tournament.id}`}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            View Participants
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
        </>
    );
}

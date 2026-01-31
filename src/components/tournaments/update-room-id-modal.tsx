'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateRoomDetails } from '@/actions/tournament-actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface UpdateRoomIdModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    existingRoomId?: string;
    existingRoomPass?: string;
}

export function UpdateRoomIdModal({
    isOpen,
    onClose,
    tournamentId,
    existingRoomId = '',
    existingRoomPass = '',
}: UpdateRoomIdModalProps) {
    const [roomId, setRoomId] = useState(existingRoomId);
    const [password, setPassword] = useState(existingRoomPass);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateRoomDetails(tournamentId, roomId, password);
            toast({
                title: 'Success',
                description: 'Room details updated successfully.',
            });
            router.refresh();
            onClose();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update room details.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Room Details</DialogTitle>
                    <DialogDescription>
                        Enter the Room ID and Password for this tournament match.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="roomId">Room ID</Label>
                        <Input
                            id="roomId"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="Enter Room ID"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

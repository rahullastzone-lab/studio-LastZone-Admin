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
import { updateTournamentPrizes } from '@/actions/tournament-actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export interface TournamentPrizes {
    prize_1st: number;
    prize_2nd: number;
    prize_3rd: number;
    prize_4th: number;
    prize_5th: number;
}

interface UpdatePrizesModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    existingPrizes?: Partial<TournamentPrizes>;
}

export function UpdatePrizesModal({
    isOpen,
    onClose,
    tournamentId,
    existingPrizes = {},
}: UpdatePrizesModalProps) {
    const [prizes, setPrizes] = useState<TournamentPrizes>({
        prize_1st: existingPrizes.prize_1st || 0,
        prize_2nd: existingPrizes.prize_2nd || 0,
        prize_3rd: existingPrizes.prize_3rd || 0,
        prize_4th: existingPrizes.prize_4th || 0,
        prize_5th: existingPrizes.prize_5th || 0,
    });

    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleChange = (key: keyof TournamentPrizes, value: string) => {
        setPrizes(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateTournamentPrizes(tournamentId, prizes);
            toast({
                title: 'Success',
                description: 'Prize pool updated successfully.',
            });
            router.refresh();
            onClose();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update prizes.',
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
                    <DialogTitle>Update Prize Pool</DialogTitle>
                    <DialogDescription>
                        Set the top 5 winners' prizes for this match.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="prize_1st">1st Prize (INR)</Label>
                        <Input
                            id="prize_1st"
                            type="number"
                            value={prizes.prize_1st || ''}
                            onChange={(e) => handleChange('prize_1st', e.target.value)}
                            placeholder="e.g. 120"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prize_2nd">2nd Prize (INR)</Label>
                        <Input
                            id="prize_2nd"
                            type="number"
                            value={prizes.prize_2nd || ''}
                            onChange={(e) => handleChange('prize_2nd', e.target.value)}
                            placeholder="e.g. 80"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prize_3rd">3rd Prize (INR)</Label>
                        <Input
                            id="prize_3rd"
                            type="number"
                            value={prizes.prize_3rd || ''}
                            onChange={(e) => handleChange('prize_3rd', e.target.value)}
                            placeholder="e.g. 50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prize_4th">4th Prize (INR)</Label>
                        <Input
                            id="prize_4th"
                            type="number"
                            value={prizes.prize_4th || ''}
                            onChange={(e) => handleChange('prize_4th', e.target.value)}
                            placeholder="e.g. 30"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prize_5th">5th Prize (INR)</Label>
                        <Input
                            id="prize_5th"
                            type="number"
                            value={prizes.prize_5th || ''}
                            onChange={(e) => handleChange('prize_5th', e.target.value)}
                            placeholder="e.g. 20"
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

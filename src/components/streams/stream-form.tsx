'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createStream, updateStream } from '@/actions/stream-actions';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { DateTimePicker } from '@/components/ui/datetime-picker';

const formSchema = z.object({
    tournament_id: z.string().min(1, 'Tournament is required'),
    youtube_url: z.string().url('Invalid YouTube URL'),
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().optional(),
    status: z.enum(['Scheduled', 'Live', 'Ended']).default('Scheduled'),
}).refine((data) => {
    if (data.end_time && data.start_time) {
        return new Date(data.end_time) > new Date(data.start_time);
    }
    return true;
}, {
    message: "End time must be after start time",
    path: ["end_time"],
});

interface StreamFormProps {
    stream?: any;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function StreamForm({ stream, trigger, onSuccess }: StreamFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const { toast } = useToast();
    const supabase = createClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tournament_id: stream?.tournament_id || '',
            youtube_url: stream?.youtube_url || '',
            start_time: stream?.start_time ? new Date(stream.start_time).toISOString() : new Date().toISOString(),
            end_time: stream?.end_time ? new Date(stream.end_time).toISOString() : '',
            status: stream?.status || 'Scheduled',
        },
    });

    useEffect(() => {
        const fetchTournaments = async () => {
            const { data } = await supabase.from('tournaments').select('id, name').order('created_at', { ascending: false });
            if (data) setTournaments(data);
        };
        if (open) fetchTournaments();
    }, [open, supabase]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            if (stream) {
                await updateStream(stream.id, values);
                toast({ title: 'Success', description: 'Stream updated successfully' });
            } else {
                await createStream(values);
                toast({ title: 'Success', description: 'Stream created successfully' });
            }
            setOpen(false);
            if (onSuccess) onSuccess();
            form.reset();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Add Stream</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{stream ? 'Edit Stream' : 'Add New Stream'}</DialogTitle>
                    <DialogDescription>
                        {stream ? 'Update the details of the live stream.' : 'Enter the details for the new live stream.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="tournament_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tournament</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a tournament" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {tournaments.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="youtube_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>YouTube URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://youtube.com/live/..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid gap-4">
                            <FormField
                                control={form.control}
                                name="start_time"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Start Time</FormLabel>
                                        <DateTimePicker
                                            date={field.value ? new Date(field.value) : undefined}
                                            setDate={(date) => field.onChange(date?.toISOString())}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="end_time"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>End Time</FormLabel>
                                        <DateTimePicker
                                            date={field.value ? new Date(field.value) : undefined}
                                            setDate={(date) => field.onChange(date?.toISOString())}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                                            <SelectItem value="Live">Live</SelectItem>
                                            <SelectItem value="Ended">Ended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

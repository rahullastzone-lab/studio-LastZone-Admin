'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type Subscriber = {
    id: string;
    username: string;
    email: string;
    whatsapp_number: string;
    game_interest: string;
    created_at: string;
};

export default function NotifySubscribersPage() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('notify_subscribers')
                .select(`
          id,
          game_interest,
          whatsapp_number,
          email,
          guest_name,
          created_at,
          profiles (
            username,
            email
          )
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedSubscribers: Subscriber[] = data.map((item: any) => ({
                    id: item.id,
                    username: item.profiles?.username || item.guest_name || 'Unknown',
                    email: item.profiles?.email || item.email || 'No Email',
                    whatsapp_number: item.whatsapp_number || '-',
                    game_interest: item.game_interest || 'General',
                    created_at: item.created_at,
                }));
                setSubscribers(mappedSubscribers);
            }
        } catch (error: any) {
            console.error('Error fetching subscribers:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch subscribers.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Notify Subscribers"
                description="Manage users subscribed to game updates and notifications."
                onRefresh={fetchSubscribers}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Subscribed Users</CardTitle>
                    <CardDescription>User interests and contact methods.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User / Email</TableHead>
                                    <TableHead>Interest</TableHead>
                                    <TableHead>WhatsApp</TableHead>
                                    <TableHead>Subscribed On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Loading subscribers...
                                        </TableCell>
                                    </TableRow>
                                ) : subscribers.length > 0 ? (
                                    subscribers.map((sub) => (
                                        <TableRow key={sub.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{sub.username}</span>
                                                    <span className="text-xs text-muted-foreground">{sub.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{sub.game_interest}</Badge>
                                            </TableCell>
                                            <TableCell>{sub.whatsapp_number}</TableCell>
                                            <TableCell>
                                                {format(new Date(sub.created_at), 'MMM d, yyyy')}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No subscribers found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

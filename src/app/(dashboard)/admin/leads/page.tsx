'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/page-header';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Lead {
    id: string;
    guest_name: string;
    email: string;
    whatsapp_number: string;
    service_type: string;
    service_name: string;
    created_at: string;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('All');
    const supabase = createClient();

    useEffect(() => {
        fetchLeads();
    }, [filterType]);

    const fetchLeads = async () => {
        setIsLoading(true);
        let query = supabase
            .from('notify_subscribers')
            .select('*')
            .order('created_at', { ascending: false });

        if (filterType !== 'All') {
            query = query.eq('service_type', filterType);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching leads:', error);
        } else {
            setLeads(data || []);
        }
        setIsLoading(false);
    };

    // Extract unique service types for the filter dropdown
    const serviceTypes = Array.from(new Set(leads.map((lead) => lead.service_type).filter(Boolean)));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Notify Requests (Leads)"
                    description="View users interested in specific tournaments or services."
                />
                <div className="flex items-center gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Types</SelectItem>
                            {serviceTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                            {/* Fallback hardcoded types if list is empty initially */}
                            {!serviceTypes.includes('Game Mode') && <SelectItem value="Game Mode">Game Mode</SelectItem>}
                            {!serviceTypes.includes('Map') && <SelectItem value="Map">Map</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Leads</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No leads found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>WhatsApp</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Interest</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>
                                            {format(new Date(lead.created_at), 'dd MMM yyyy, hh:mm a')}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {lead.guest_name || 'Guest'}
                                        </TableCell>
                                        <TableCell>
                                            {lead.whatsapp_number ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-green-600">
                                                        {lead.whatsapp_number}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{lead.email || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{lead.service_type || 'General'}</Badge>
                                        </TableCell>
                                        <TableCell>{lead.service_name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import { createClient } from '@/lib/supabase/server';
import { DataTable } from './data-table';
import { columns } from './columns';
import { StreamForm } from '@/components/streams/stream-form';

export default async function StreamsPage() {
    const supabase = await createClient();
    const { data: streams } = await supabase
        .from('tournament_streams')
        .select('*, tournaments(name)')
        .order('start_time', { ascending: false });

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Tournament Live Streams</h1>
                <StreamForm />
            </div>
            <DataTable columns={columns} data={streams || []} />
        </div>
    );
}

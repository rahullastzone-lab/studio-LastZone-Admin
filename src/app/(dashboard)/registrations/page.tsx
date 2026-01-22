'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { columns, Registration } from './columns';
import { DataTable } from './data-table';
import PageHeader from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';

export default function RegistrationsPage() {
  const [data, setData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournament_id');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch from 'registrations' (Tournament level)
        let query = supabase
          .from('registrations')
          .select(`
            id, created_at, status, player_details,
            tournaments ( name, game_type ),
            profiles ( username, avatar_url, in_game_name, bgmi_id, email, phone )
          `)
          .order('created_at', { ascending: false });

        if (tournamentId) {
          query = query.eq('tournament_id', tournamentId);
        }

        const { data: tournamentRegs, error: tError } = await query;

        if (tError) throw tError;

        console.log('Fetched Registrations:', tournamentRegs);

        const formattedData = (tournamentRegs as any[])?.map(r => ({
          ...r,
          source: 'Tournament'
        })) || [];

        setData(formattedData);

      } catch (error: any) {
        toast({
          title: 'Error fetching registrations',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, toast]);

  if (loading) {
    return <div className="p-8">Loading registrations...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Registered Players"
        description={tournamentId ? "Viewing registrations for specific tournament" : "View all player registrations for tournaments and matches."}
      />

      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}

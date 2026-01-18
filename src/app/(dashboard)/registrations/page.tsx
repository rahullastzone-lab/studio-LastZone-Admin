'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch from 'registrations' (Tournament level)
        const { data: tournamentRegs, error: tError } = await supabase
          .from('registrations')
          .select(`
            id, created_at, status, player_details,
            tournaments:tournament_id ( name, game_type ),
            profiles:user_id ( username, avatar_url )
          `)
          .order('created_at', { ascending: false });

        if (tError) throw tError;

        // Fetch from 'match_registrations' (Match level)
        const { data: matchRegs, error: mError } = await supabase
          .from('match_registrations')
          .select(`
            id, created_at, status, 
            matches:match_id ( id, room_id, tournaments:tournament_id ( name, game_type ) ),
            profiles:user_id ( username, avatar_url )
          `)
          .order('created_at', { ascending: false });

        if (mError) throw mError;

        // Combine and map data
        const tData = (tournamentRegs as any[])?.map(r => ({
          ...r,
          source: 'Tournament'
        })) || [];

        const mData = (matchRegs as any[])?.map(r => ({
          id: r.id,
          created_at: r.created_at,
          status: r.status,
          // Map match info to similar structure
          tournaments: {
            name: r.matches?.tournaments?.name || "Match",
            game_type: r.matches?.tournaments?.game_type || "Unknown"
          },
          profiles: r.profiles,
          player_details: {}, // match_registrations might not have player_details yet, or we need to check schema
          source: 'Match'
        })) || [];

        // Sort combined data by date desc
        const combined = [...tData, ...mData].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setData(combined);

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
        description="View all player registrations for tournaments and matches."
      />

      <div className="container mx-auto py-10">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}

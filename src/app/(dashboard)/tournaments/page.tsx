'use client';

import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import TournamentsClient from './tournaments-client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { type Tournament } from '@/lib/data';

export default function TournamentsPage() {
  const [data, setData] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch tournaments and related game name if available
        // Note: Schema might use game_id referencing games(id) or just game_type string
        const { data: tournaments, error } = await supabase
          .from('tournaments')
          .select(`
                    *,
                    games (
                        name
                    )
                `);

        if (error) {
          console.error("Error fetching tournaments:", error);
          toast({
            title: "Error fetching tournaments",
            description: error.message,
            variant: "destructive"
          });
        } else {
          const mappedData: Tournament[] = tournaments?.map((t: any) => ({
            id: t.id,
            name: t.name,
            // Use game name from relation if available, otherwise fallback to game_type column, otherwise 'Unknown'
            game_type: t.games?.name || t.game_type || 'Unknown',
            map: t.map,
            mode: t.mode,
            entry_fee: t.entry_fee,
            prize_pool: t.prize_pool,
            per_kill: t.per_kill,
            start_time: t.start_time,
            status: t.status,
          })) || [];
          setData(mappedData);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading tournaments...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tournaments"
        description="Manage all esports tournaments."
      >
        <div className="flex gap-2">
          <Button variant="secondary" disabled>
            Coming Soon
          </Button>
          <Button asChild>
            <Link href="/tournaments/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Tournament
            </Link>
          </Button>
        </div>
      </PageHeader>
      <TournamentsClient data={data} />
    </div>
  );
}

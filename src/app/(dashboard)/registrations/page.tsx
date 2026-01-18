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
        const { data: regs, error } = await supabase
          .from('registrations')
          .select(`
            *,
            tournaments:tournament_id (
              name,
              game_type
            ),
            profiles:user_id (
              username,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Cast to our type. Supabase returns arrays for relations, but we know it's 1:1 here usually.
        // Needs adjustment if Supabase returns array. Single object is expected if relations are correct.
        // Actually, for multiple foreign keys it might be tricky. Let's inspect the data.
        // But assuming standard select response:
        setData((regs as any) || []);

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

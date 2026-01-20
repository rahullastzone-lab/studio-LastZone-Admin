'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from './data-table';
import { columns } from './columns';
import type { Tournament } from '@/lib/data';

export default function TournamentsClient({ data }: { data: Tournament[] }) {
  const now = new Date();
  const oneHour = 60 * 60 * 1000;

  const upcomingTournaments = data.filter(t => new Date(t.start_time).getTime() > now.getTime());

  const liveTournaments = data.filter(t => {
    const start = new Date(t.start_time).getTime();
    const diff = now.getTime() - start;
    return diff >= 0 && diff < oneHour;
  });

  const completedTournaments = data.filter(t => {
    const start = new Date(t.start_time).getTime();
    const diff = now.getTime() - start;
    return diff >= oneHour;
  });

  return (
    <Tabs defaultValue="upcoming">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming ({upcomingTournaments.length})</TabsTrigger>
        <TabsTrigger value="live">Live ({liveTournaments.length})</TabsTrigger>
        <TabsTrigger value="completed">Completed ({completedTournaments.length})</TabsTrigger>
        <TabsTrigger value="all">All</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming">
        <DataTable columns={columns} data={upcomingTournaments} searchKey="name" />
      </TabsContent>
      <TabsContent value="live">
        <DataTable columns={columns} data={liveTournaments} searchKey="name" />
      </TabsContent>
      <TabsContent value="completed">
        <DataTable columns={columns} data={completedTournaments} searchKey="name" />
      </TabsContent>
      <TabsContent value="all">
        <DataTable columns={columns} data={data} searchKey="name" />
      </TabsContent>
    </Tabs>
  );
}

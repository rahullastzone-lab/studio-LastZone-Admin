'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from './data-table';
import { columns } from './columns';
import type { Tournament } from '@/lib/data';

export default function TournamentsClient({ data }: { data: Tournament[] }) {
  const megaTournaments = data.filter((t) => t.prize_pool >= 5000);
  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All Tournaments</TabsTrigger>
        <TabsTrigger value="mega">Mega Tournaments</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <DataTable columns={columns} data={data} searchKey="name" />
      </TabsContent>
      <TabsContent value="mega">
        <DataTable columns={columns} data={megaTournaments} searchKey="name" />
      </TabsContent>
    </Tabs>
  );
}

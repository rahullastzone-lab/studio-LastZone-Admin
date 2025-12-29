'use client';

import PageHeader from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NotificationSubscription } from '@/lib/data';
import { columns } from './columns';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

function DataTable<TData, TValue>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (!isClient) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>
                  {typeof column.header === 'string' ? column.header : '...'}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Loading...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function RegistrationsPage() {
  const [data, setData] = useState<NotificationSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const { data: subs, error } = await supabase
          .from('notify_subscribers')
          .select('*, profiles(username, email)');

        if (error) throw error;

        const mappedData: NotificationSubscription[] = (subs || []).map((s: any) => ({
          id: s.id,
          name: s.profiles?.username || 'Unknown',
          email: s.profiles?.email || 'Unknown',
          whatsappNumber: s.whatsapp_number || 'N/A',
          interest: s.game_interest,
          createdAt: s.created_at,
        }));
        setData(mappedData);

      } catch (error: any) {
        toast({
          title: "Error fetching subscriptions",
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const mainInterests = [
    'BGMI',
    'FreeFire',
    'COD Mobile',
    'In-Game Service',
    'Mega Tournament',
  ];

  const marketplaceInterests = [
    'BGMI ID Sell',
    'BGMI ID Buy',
    'FreeFire ID Sell',
    'FreeFire ID Buy',
    'COD Mobile ID Sell',
    'COD Mobile ID Buy',
  ];

  if (isLoading && data.length === 0) {
    return <div className="p-8">Loading subscriptions...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notification Subscriptions"
        description="Users who requested notifications for games and services."
      />
      <Card>
        <CardHeader>
          <CardTitle>Subscription List</CardTitle>
          <CardDescription>
            A log of all users who clicked 'Notify Me' for various services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              {mainInterests.map((interest) => (
                <TabsTrigger key={interest} value={interest}>
                  {interest}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <DataTable columns={columns} data={data.filter(d => mainInterests.includes(d.interest) || !marketplaceInterests.includes(d.interest))} />
            </TabsContent>
            {mainInterests.map((interest) => (
              <TabsContent key={interest} value={interest}>
                <DataTable
                  columns={columns}
                  data={data.filter((d) => d.interest === interest)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketplace Subscriptions</CardTitle>
          <CardDescription>
            Users interested in buying or selling game IDs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={marketplaceInterests[0]}>
            <TabsList className="h-auto flex-wrap justify-start">
              {marketplaceInterests.map((interest) => (
                <TabsTrigger key={interest} value={interest}>
                  {interest}
                </TabsTrigger>
              ))}
            </TabsList>

            {marketplaceInterests.map((interest) => (
              <TabsContent key={interest} value={interest}>
                <DataTable
                  columns={columns}
                  data={data.filter((d) => d.interest === interest)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

    </div>
  );
}

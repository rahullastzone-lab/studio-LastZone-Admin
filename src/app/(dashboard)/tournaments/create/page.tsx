'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const formSchema = z
  .object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    game_type: z.enum(['BGMI', 'FreeFire', 'COD Mobile'], {
      required_error: 'Please select a game.',
    }),
    map: z.enum([
      'Erangel', 'Livik', 'Miramar', 'Sanhok', 'TDM',
      'Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Nexterra', 'Bermuda Remastered',
      'Isolated', 'Blackout', 'Alcatraz', 'Nuketown', 'Crash', 'Crossfire', 'Standoff', 'Raid', 'Summit', 'Firing Range'
    ], {
      required_error: 'Please select a map.',
    }),
    mode: z.enum(['Solo', 'Duo', 'Squad'], {
      required_error: 'Please select a mode.',
    }),
    entry_fee: z.coerce.number().min(0),
    prize_pool: z.coerce.number().min(0),
    per_kill: z.coerce.number().min(0),
    start_date: z.string().regex(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/, {
      message: 'Invalid date format. Use DD-MM-YYYY.',
    }),
    start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: 'Invalid time format. Use HH:MM.',
    }),
    // Match details
    roomId: z.string().optional(),
    roomPassword: z.string().optional(),
  });

export default function CreateTournamentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      entry_fee: 0,
      prize_pool: 0,
      per_kill: 0,
      start_date: '',
      start_time: '',
      roomId: '',
      roomPassword: '',
    },
  });

  const gameType = form.watch('game_type');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 1. Construct Timestamp
      const [day, month, year] = values.start_date.split('-').map(Number);
      const [hours, minutes] = values.start_time.split(':').map(Number);
      const startDateObj = new Date(year, month - 1, day, hours, minutes);
      const startTimeISO = startDateObj.toISOString();

      // 2. Insert Tournament
      const { data: tournament, error: tError } = await supabase
        .from('tournaments')
        .insert({
          name: values.name,
          game_type: values.game_type, // Assuming schema has this column, or use game_id if you implemented relations strict
          map: values.map,
          mode: values.mode,
          entry_fee: values.entry_fee,
          prize_pool: values.prize_pool,
          per_kill: values.per_kill,
          start_time: startTimeISO,
          status: 'Open',
        })
        .select()
        .single();

      if (tError) throw tError;

      if (tournament) {
        // 3. Insert Initial Match (if room details provided or just to initialize)
        // Even if empty, usually a tournament has at least one match scheduled
        const { error: mError } = await supabase
          .from('matches')
          .insert({
            tournament_id: tournament.id,
            room_id: values.roomId || '',
            room_password: values.roomPassword || '',
            start_time: startTimeISO,
            status: 'Scheduled'
          });

        if (mError) {
          console.error("Error creating match, details:", JSON.stringify(mError, null, 2));
          console.log("Tournament ID:", tournament.id);
          console.log("Payload:", {
            tournament_id: tournament.id,
            room_id: values.roomId || '',
            room_password: values.roomPassword || '',
            start_time: startTimeISO,
            status: 'Scheduled'
          });
          // We don't stop flow here, key is tournament creation
        }
      }

      toast({
        title: 'Tournament Created!',
        description: `${values.name} has been created successfully.`,
      });

      router.push('/tournaments');
      router.refresh();

    } catch (error: any) {
      if (error?.code === 'PGRST205') {
        toast({
          title: 'Database Sync Error',
          description: 'The "matches" table exists but Supabase API has not detected it yet. Please run "src/lib/supabase/force_schema_refresh.sql" in your Supabase SQL Editor.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Something went wrong.',
          variant: 'destructive',
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Create New Tournament"
        description="Fill in the details to set up a new tournament."
      />
      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., BGMI Weekend Warfare"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="game_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a game" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BGMI">BGMI</SelectItem>
                          <SelectItem value="FreeFire">FreeFire</SelectItem>
                          <SelectItem value="COD Mobile">COD Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="map"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Map</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a map" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(gameType === 'BGMI' || !gameType) && (
                            <>
                              <SelectItem value="Erangel">Erangel</SelectItem>
                              <SelectItem value="Miramar">Miramar</SelectItem>
                              <SelectItem value="Sanhok">Sanhok</SelectItem>
                              <SelectItem value="Livik">Livik</SelectItem>
                              <SelectItem value="TDM">TDM</SelectItem>
                            </>
                          )}
                          {(gameType === 'FreeFire') && (
                            <>
                              <SelectItem value="Bermuda">Bermuda</SelectItem>
                              <SelectItem value="Purgatory">Purgatory</SelectItem>
                              <SelectItem value="Kalahari">Kalahari</SelectItem>
                              <SelectItem value="Alpine">Alpine</SelectItem>
                              <SelectItem value="Nexterra">Nexterra</SelectItem>
                              <SelectItem value="Bermuda Remastered">Bermuda Remastered</SelectItem>
                            </>
                          )}
                          {(gameType === 'COD Mobile') && (
                            <>
                              <SelectItem value="Isolated">Isolated (BR)</SelectItem>
                              <SelectItem value="Blackout">Blackout (BR)</SelectItem>
                              <SelectItem value="Alcatraz">Alcatraz (BR)</SelectItem>
                              <SelectItem value="Nuketown">Nuketown (MP)</SelectItem>
                              <SelectItem value="Crash">Crash (MP)</SelectItem>
                              <SelectItem value="Crossfire">Crossfire (MP)</SelectItem>
                              <SelectItem value="Standoff">Standoff (MP)</SelectItem>
                              <SelectItem value="Raid">Raid (MP)</SelectItem>
                              <SelectItem value="Summit">Summit (MP)</SelectItem>
                              <SelectItem value="Firing Range">Firing Range (MP)</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Solo">Solo</SelectItem>
                          <SelectItem value="Duo">Duo</SelectItem>
                          <SelectItem value="Squad">Squad</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entry_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Fee (INR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0 for free"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prize_pool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Prize Pool (INR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 5000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="per_kill"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Per Kill Prize (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input placeholder="DD-MM-YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time (24h)</FormLabel>
                      <FormControl>
                        <Input placeholder="HH:MM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div />
                <FormField
                  control={form.control}
                  name="roomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter match room ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roomPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Password (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter match room password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit">Create Tournament</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

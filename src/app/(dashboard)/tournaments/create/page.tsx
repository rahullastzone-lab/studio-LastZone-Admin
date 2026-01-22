'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';

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
    // New fields
    category: z.enum(['Normal', 'Mega']).default('Normal'),
    is_coming_soon: z.boolean().default(false),
  });

// ... existing imports ...

// Helper function to generate time options
const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')); // 00, 05, 10 ... 55

// Helper arrays for Date Picker
const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const months = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
  { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
  { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());

export default function CreateTournamentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  // Local state for 12h time picker
  const [selectedHour, setSelectedHour] = useState<string>('12');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [selectedAmPm, setSelectedAmPm] = useState<string>('PM');

  // Local state for Date Picker
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      entry_fee: 0,
      prize_pool: 0,
      per_kill: 0,
      start_date: '',
      start_time: '12:00', // Default to 12:00 (24h) which matches 12:00 PM
      roomId: '',
      roomPassword: '',
      category: 'Normal',
      is_coming_soon: false,
    },
  });

  // Sync Date selections to form's start_date
  useEffect(() => {
    if (selectedDay && selectedMonth && selectedYear) {
      const dateStr = `${selectedDay}-${selectedMonth}-${selectedYear}`;
      form.setValue('start_date', dateStr);
    }
  }, [selectedDay, selectedMonth, selectedYear, form]);

  // Sync 12h selections to form's 24h start_time
  useEffect(() => {
    let hourInt = parseInt(selectedHour);
    if (selectedAmPm === 'PM' && hourInt !== 12) hourInt += 12;
    if (selectedAmPm === 'AM' && hourInt === 12) hourInt = 0;

    const hourStr = hourInt.toString().padStart(2, '0');
    const timeStr = `${hourStr}:${selectedMinute}`;
    form.setValue('start_time', timeStr);
  }, [selectedHour, selectedMinute, selectedAmPm, form]);

  const gameType = form.watch('game_type');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // ... existing submit logic
    try {
      // 1. Construct Timestamp
      const [day, month, year] = values.start_date.split('-').map(Number);
      const [hours, minutes] = values.start_time.split(':').map(Number);
      const startDateObj = new Date(year, month - 1, day, hours, minutes);
      const startTimeISO = startDateObj.toISOString();

      // 1.5 Fetch Game ID
      // We explicitly look up the game ID from the 'games' table to ensure relationships work
      const { data: gameData } = await supabase
        .from('games')
        .select('id')
        .eq('name', values.game_type)
        .single();

      // 2. Insert Tournament
      const { data: tournament, error: tError } = await supabase
        .from('tournaments')
        .insert({
          name: values.name,
          game_type: values.game_type,
          game_id: gameData?.id, // Link to games table
          map: values.map,
          mode: values.mode,
          entry_fee: values.entry_fee,
          prize_pool: values.prize_pool,
          per_kill: values.per_kill,
          start_time: startTimeISO,
          status: 'Open',
          category: values.category,
          is_coming_soon: values.is_coming_soon,
        })
        .select()
        .single();

      if (tError) throw tError;

      if (tournament) {
        // 3. Insert Initial Match
        const { error: mError } = await supabase
          .from('matches')
          .insert({
            tournament_id: tournament.id,
            room_id: values.roomId || '',
            room_password: values.roomPassword || '',
            start_time: startTimeISO, // Use the ISO string derived from the form values
            status: 'Open'
          });

        if (mError) {
          console.error("Error creating match, details:", JSON.stringify(mError, null, 2));
          // ... existing error logging
        }
      }

      toast({
        title: 'Tournament Created!',
        description: `${values.name} has been created successfully.`,
      });

      router.push('/tournaments');
      router.refresh();

    } catch (error: any) {
      // ... existing error handling
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
                {/* ... existing fields: Name, Category, Coming Soon ... */}
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Mega">Mega</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_coming_soon"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Coming Soon</FormLabel>
                        <div className="text-[0.8rem] text-muted-foreground">
                          Mark this tournament as coming soon
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* ... existing fields: Game, Map, Mode, Logic same ... */}

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

                {/* NEW Start Date Picker (Day / Month / Year) */}
                <div className="flex flex-col space-y-2">
                  <FormLabel>Start Date</FormLabel>
                  <div className="flex gap-2">
                    {/* Day Selector */}
                    <div className="flex-1">
                      <Select value={selectedDay} onValueChange={setSelectedDay}>
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Month Selector */}
                    <div className="flex-1">
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Year Selector */}
                    <div className="flex-1">
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Hidden input to register value with react-hook-form */}
                  <input type="hidden" {...form.register('start_date')} />
                  <FormMessage>{form.formState.errors.start_date?.message}</FormMessage>
                </div>

                {/* NEW AM/PM Time Picker */}
                <div className="flex flex-col space-y-2">
                  <FormLabel>Start Time</FormLabel>
                  <div className="flex gap-2">
                    {/* Hour Selector */}
                    <div className="flex-1">
                      <Select value={selectedHour} onValueChange={setSelectedHour}>
                        <SelectTrigger>
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {hours.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Minute Selector */}
                    <div className="flex-1">
                      <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                        <SelectTrigger>
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          {minutes.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* AM/PM Selector */}
                    <div className="flex-1">
                      <Select value={selectedAmPm} onValueChange={setSelectedAmPm}>
                        <SelectTrigger>
                          <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Hidden input to register value with react-hook-form */}
                  <input type="hidden" {...form.register('start_time')} />
                  <FormMessage>{form.formState.errors.start_time?.message}</FormMessage>
                </div>

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

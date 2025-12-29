'use client';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

const chartConfig = {
  registrations: {
    label: 'Registrations',
    color: 'hsl(var(--primary))',
  },
};

export default function RegistrationsChart() {
  const [data, setData] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(today, 6 - i);
        return {
          date: format(d, 'EEE'), // 'Sun', 'Mon'
          fullDate: format(d, 'yyyy-MM-dd'),
          registrations: 0,
        };
      });

      const startDate = subDays(today, 6).toISOString();

      const { data: regs } = await supabase
        .from('registrations')
        .select('created_at')
        .gte('created_at', startDate);

      if (regs) {
        regs.forEach((r) => {
          const regDate = format(new Date(r.created_at), 'yyyy-MM-dd');
          const dayStat = last7Days.find((d) => d.fullDate === regDate);
          if (dayStat) {
            dayStat.registrations += 1;
          }
        });
      }

      setData(last7Days);
    }

    fetchData();
  }, []);

  if (!data.length) {
    return null; // Or a loading skeleton
  }

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            stroke="hsl(var(--foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<ChartTooltipContent />}
          />
          <Bar
            dataKey="registrations"
            fill="var(--color-registrations)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

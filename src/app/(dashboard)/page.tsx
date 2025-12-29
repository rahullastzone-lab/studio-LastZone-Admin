'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Users, Trophy, Wallet } from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import RegistrationsChart from '@/components/dashboard/registrations-chart';
import RecentActivity from '@/components/dashboard/recent-activity';
import PageHeader from '@/components/page-header';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    activeTournaments: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Total Revenue (from Completed Tournaments Prize Pool - matching previous logic)
        // Note: Real revenue calculation might differ, but sticking to legacy mock logic for now.
        const { data: revenueData } = await supabase
          .from('tournaments')
          .select('prize_pool')
          .eq('status', 'Completed');

        const totalRevenue = revenueData?.reduce((acc, t) => acc + (t.prize_pool || 0), 0) || 0;

        // 2. Total Users
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // 3. Active Tournaments
        const { count: activeTournaments } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Open');

        // 4. Pending Withdrawals
        const { data: withdrawalsData } = await supabase
          .from('withdrawals')
          .select('amount')
          .eq('status', 'Pending');

        const pendingWithdrawalsCount = withdrawalsData?.length || 0;
        const pendingWithdrawalsAmount = withdrawalsData?.reduce((acc, w) => acc + (w.amount || 0), 0) || 0;

        setStats({
          totalRevenue,
          totalUsers: totalUsers || 0,
          activeTournaments: activeTournaments || 0,
          pendingWithdrawals: pendingWithdrawalsCount,
          pendingWithdrawalsAmount,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard Overview" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              icon={<DollarSign />}
              description="from completed tournaments"
            />
            <StatCard
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon={<Users />}
              description="+18.1% from last month"
            />
            <StatCard
              title="Active Tournaments"
              value={stats.activeTournaments.toString()}
              icon={<Trophy />}
              description="currently open for registration"
            />
            <StatCard
              title="Pending Withdrawals"
              value={stats.pendingWithdrawals.toString()}
              icon={<Wallet />}
              description={`Totaling ₹${stats.pendingWithdrawalsAmount.toLocaleString(
                'en-IN'
              )}`}
            />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Daily Registrations</CardTitle>
            <CardDescription>
              New tournament registrations over the last 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RegistrationsChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              A log of recent platform activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

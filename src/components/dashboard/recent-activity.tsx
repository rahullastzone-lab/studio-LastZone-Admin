'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

type Activity = {
  id: string;
  username: string;
  avatarUrl?: string; // We might not have this easily without joining, will use fallback
  action: string;
  time: string; // ISO string
};

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchActivity() {
      // Fetch recent transactions (Deposits, Withdrawals, Winnings)
      const { data: txnData } = await supabase
        .from('transactions')
        .select('id, username, type, amount, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent registrations
      const { data: regData } = await supabase
        .from('registrations')
        .select('id, created_at, team_name, profiles(username), tournaments(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const txns: Activity[] = (txnData || []).map(t => {
        let actionText = '';
        const amount = `₹${t.amount}`;
        switch (t.type) {
          case 'Deposit': actionText = `deposited ${amount} to their wallet.`; break;
          case 'Withdrawal': actionText = `requested a withdrawal of ${amount}.`; break;
          case 'Winnings': actionText = `won ${amount}.`; break;
          case 'Refund': actionText = `received a refund of ${amount}.`; break;
          default: actionText = `processed a transaction of ${amount}.`;
        }
        return {
          id: t.id,
          username: t.username || 'User',
          action: actionText,
          time: t.created_at
        };
      });

      const regs: Activity[] = (regData || []).map(r => ({
        id: r.id,
        username: (r.profiles as any)?.username || 'User',
        action: `registered for "${(r.tournaments as any)?.name}".`,
        time: r.created_at
      }));

      const combined = [...txns, ...regs]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);

      setActivities(combined);
      setLoading(false);
    }

    fetchActivity();
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading activity...</div>;
  }

  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center gap-4">
          <Avatar className="h-9 w-9">
            {/* Ideally we fetch avatar url, but for now fallback */}
            <AvatarFallback>
              {(activity.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-1 text-sm">
            <p className="font-medium">
              {activity.username}
              <span className="font-normal text-muted-foreground">
                {' '}
                {activity.action}
              </span>
            </p>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import PageHeader from '@/components/page-header';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import WithdrawalRequests from './withdrawal-requests';
import TransactionLogs from './transaction-logs';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Withdrawal, Transaction } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function FinancialsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Withdrawals with Username
      const { data: wdData, error: wdError } = await supabase
        .from('withdrawals')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });

      if (wdError) throw wdError;

      // Map withdrawals to include username from relation
      const mappedWithdrawals: Withdrawal[] = (wdData || []).map((w: any) => ({
        id: w.id,
        user_id: w.user_id,
        username: w.profiles?.username || 'Unknown',
        amount: w.amount,
        upi_id: w.upi_id,
        status: w.status,
      }));

      // Fetch Transactions with Username
      const { data: txnData, error: txnError } = await supabase
        .from('transactions')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });

      if (txnError) throw txnError;

      // Map transactions to include username from relation
      const mappedTransactions: Transaction[] = (txnData || []).map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        username: t.profiles?.username || 'Unknown',
        amount: t.amount,
        type: t.type,
        status: t.status,
        created_at: t.created_at,
      }));

      setWithdrawals(mappedWithdrawals);
      setTransactions(mappedTransactions);

    } catch (error: any) {
      console.error("Error fetching financials:", error);
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading && withdrawals.length === 0 && transactions.length === 0) {
    return <div className="p-8">Loading financial data...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financial & Wallet Center"
        description="Manage withdrawals and view all transactions."
      />
      <Tabs defaultValue="withdrawals">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="withdrawals">
          <WithdrawalRequests data={withdrawals} onRefresh={fetchData} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionLogs data={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

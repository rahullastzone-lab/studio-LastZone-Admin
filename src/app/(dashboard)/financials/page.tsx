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
import { Transaction } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { AddFundsModal } from '@/components/financials/add-funds-modal';

export default function FinancialsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchData = async () => {
    // Only fetch transactions locally for the logs tab. 
    // Withdrawals handled by its own component.
    setIsLoading(true);
    try {
      // Fetch Transactions with Username
      const { data: txnData, error: txnError } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:user_id(username, email)
        `)
        .order('created_at', { ascending: false });

      if (txnError) throw txnError;

      // Map transactions to include username from relation
      const mappedTransactions: Transaction[] = (txnData || []).map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        username: t.profiles?.username || t.profiles?.email || 'Unknown',
        amount: t.amount,
        type: t.type,
        status: t.status,
        description: t.description,
        created_at: t.created_at,
      }));

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Financial & Wallet Center"
          description="Manage withdrawals and view all transactions."
          onRefresh={fetchData}
        />
        <AddFundsModal onSuccess={fetchData} />
      </div>

      <Tabs defaultValue="withdrawals">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="withdrawals">
          <WithdrawalRequests onRefresh={fetchData} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionLogs data={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import TransactionLogs from '@/components/dashboard/TransactionLogs';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTransactionData } from '@/hooks/useTransactionData';

interface Transaction {
  id: string;
  type: 'withdrawal';
  status: 'pending' | 'successful' | 'failed';
  amount: number;
  date: string;
  collection?: string;
  description?: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { useTransactionsList } = useTransactionData();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const { 
    data: transactionsData,
    isLoading,
    error 
  } = useTransactionsList(user?.id);

  useEffect(() => {
    if (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
    }
  }, [error]);

  useEffect(() => {
    if (transactionsData && transactionsData.data) {
      // Transform transactions data into the expected format
      const txlogs: Transaction[] = transactionsData.data.map((t) => {
        // Determine transaction status based on type and withdrawal_id
        let status: 'pending' | 'successful' | 'failed' = 'successful';
        
        if (t.withdrawal_id) {
          status = 'pending'; // Default to pending for withdrawals unless we know otherwise
        }

        if (t.type === 'withdrawal_failed') {
          status = 'failed';
        }
        
        return {
          id: t.id,
          type: 'withdrawal',
          status: status,
          amount: t.amount,
          date: t.created_at,
          collection: t.collections?.title || undefined,
          description: t.description,
        };
      });
      
      setTransactions(txlogs);
    }
  }, [transactionsData]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      {isLoading ? (
        <div className="text-center py-10 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-muted-foreground">Loading transactions...</span>
        </div>
      ) : (
        <TransactionLogs transactions={transactions} />
      )}
    </div>
  );
};

export default ProfilePage;

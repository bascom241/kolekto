
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { WithdrawFundsDialog } from '@/components/withdrawals/WithdrawFundsDialog';
import { toast } from 'sonner';
import TransactionLogs from '@/components/dashboard/TransactionLogs';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const TransactionHistoryPage: React.FC = () => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const { user } = useAuth();
  const { 
    useCollectionsList, 
    useTransactionsList, 
    useWithdrawalsList, 
    submitWithdrawal 
  } = useTransactions();
  
  const { 
    data: collections, 
    isLoading: collectionsLoading 
  } = useCollectionsList(user?.id);
  
  const {
    data: transactions,
    isLoading: transactionsLoading
  } = useTransactionsList(user?.id);
  
  const {
    data: withdrawals,
    isLoading: withdrawalsLoading
  } = useWithdrawalsList(user?.id);
  
  // Calculate total earnings across all collections based on their actual total_raised value
  const totalEarnings = collections?.reduce((total, collection) => {
    return total + (collection.total_raised || 0);
  }, 0) || 0;
  
  // Prepare collection earnings data for the table using the actual total_raised values
  const collectionEarnings = collections?.map(collection => {
    // Calculate withdrawable amount (90% of total raised)
    const withdrawable = (collection.total_raised || 0) * 0.9;
    
    return {
      id: collection.id,
      title: collection.title,
      amount: collection.amount,
      totalCollected: collection.total_raised || 0,
      withdrawable,
    };
  }) || [];
  
  // Process withdrawal data for the transaction logs
  const formattedWithdrawals = withdrawals?.map(withdrawal => ({
    id: withdrawal.id,
    type: 'withdrawal' as const,
    status: withdrawal.status as 'pending' | 'successful' | 'failed',
    amount: withdrawal.amount,
    date: withdrawal.created_at,
    collection: withdrawal.collections?.title || 'Unknown Collection',
    description: withdrawal.reason_if_failed || undefined,
  })) || [];
  
  const handleWithdraw = (collection: any) => {
    setSelectedCollection(collection);
    setIsWithdrawDialogOpen(true);
  };
  
  const onWithdrawComplete = async (data: {
    amount: number;
    accountName: string;
    accountNumber: string;
    bankName: string;
  }) => {
    if (!user?.id || !selectedCollection) {
      toast.error('Unable to process withdrawal. Please try again.');
      return;
    }

    try {
      await submitWithdrawal({
        organizer_id: user.id,
        collection_id: selectedCollection.id,
        amount: data.amount,
        account_name: data.accountName,
        account_number: data.accountNumber,
        bank_name: data.bankName
      });
      
      setIsWithdrawDialogOpen(false);
      toast.success('Withdrawal request is in progress. You\'ll be notified once it\'s completed.');
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Failed to submit withdrawal request');
    }
  };
  
  const isLoading = collectionsLoading || transactionsLoading || withdrawalsLoading;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mr-2" />
        <p className="text-gray-500">Loading transaction data...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Total Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">₦{totalEarnings.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total amount collected across all collections</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Earnings per Collection</CardTitle>
        </CardHeader>
        <CardContent>
          {collectionEarnings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collection</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Total Collected</TableHead>
                  <TableHead>Withdrawable</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionEarnings.map(collection => (
                  <TableRow key={collection.id}>
                    <TableCell className="font-medium">{collection.title}</TableCell>
                    <TableCell>₦{collection.amount.toLocaleString()}</TableCell>
                    <TableCell>₦{collection.totalCollected.toLocaleString()}</TableCell>
                    <TableCell>₦{collection.withdrawable.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button 
                        onClick={() => handleWithdraw(collection)} 
                        variant="outline" 
                        size="sm"
                        className="flex items-center"
                        disabled={collection.withdrawable <= 0}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Withdraw
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-6 text-center text-gray-500">
              <p>No collections with earnings found</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <TransactionLogs transactions={formattedWithdrawals} />
      
      {selectedCollection && (
        <WithdrawFundsDialog 
          open={isWithdrawDialogOpen}
          onOpenChange={setIsWithdrawDialogOpen}
          onComplete={onWithdrawComplete}
          availableBalance={selectedCollection.withdrawable}
          collectionId={selectedCollection.id}
          collectionTitle={selectedCollection.title}
        />
      )}
    </div>
  );
};

export default TransactionHistoryPage;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Download, ArrowDownCircle, ArrowUpCircle, Percent, CreditCard } from 'lucide-react';
import { WithdrawFundsDialog } from '@/components/withdrawals/WithdrawFundsDialog';
import { toast } from 'sonner';
import TransactionLogs from '@/components/dashboard/TransactionLogs';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { calculatePlatformChargePercentage } from '@/utils/dbHelpers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useCollectionStore } from '@/store/useCollectionStore';

const TransactionHistoryPage: React.FC = () => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const { user } = useAuth();
  const { 
    useCollectionsList,
    useTransactionsList,
    useFinancialSummary 
  } = useTransactions();
  
  // const { data: collections, isLoading: collectionsLoading } = useCollectionsList(user?.id);
  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary(user?.id);
  const { 
    data: transactionsData, 
    isLoading: transactionsLoading 
  } = useTransactionsList(user?.id, undefined, 1, 10);
  
    const { collections, isLoading:collectionsLoading, error, fetchCollections } = useCollectionStore();
  

  const transactions = transactionsData?.data || [];
  console.log(collections, 'collection');

  // Calculate withdrawable amount and platform fee tier for each collection
  const collectionEarnings = collections?.map(collection => {
    const totalCollected = collection.total_amount || 0;
    const platformFeePercent = calculatePlatformChargePercentage(totalCollected) * 100;
    const platformFee = totalCollected * calculatePlatformChargePercentage(totalCollected);
    const gatewayFee = Math.min(totalCollected * 0.015, 2000); // 1.5% capped at ₦2,000
    const withdrawable = totalCollected - (platformFee + gatewayFee);
    
    return {
      id: collection.id,
      title: collection.title,
      amount: collection.amount,
      totalCollected,
      platformFeePercent,
      platformFee,
      gatewayFee,
      withdrawable,
    };
  }) || [];
  
  const handleWithdraw = (collection: any) => {
    setSelectedCollection(collection);
    setIsWithdrawDialogOpen(true);
  };
  
  const onWithdrawComplete = () => {
    setIsWithdrawDialogOpen(false);
    toast.success('Withdrawal request is in progress. You\'ll be notified once it\'s completed.');
  };

  const isLoading = collectionsLoading || transactionsLoading || summaryLoading;

  // Map transactions to the format expected by TransactionLogs
  const formattedTransactions = transactions.map(t => ({
    id: t.id,
    type: t.type as 'withdrawal' | 'contribution' | 'refund',
    status: t.withdrawalStatus || (t.type === 'contribution' ? 'successful' : 'pending'),
    amount: t.amount,
    date: t.created_at,
    collection: t.collections?.title || '',
    description: t.description || ''
  }));
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-100 rounded-md"></div>
          <div className="h-48 bg-gray-100 rounded-md"></div>
          <div className="h-48 bg-gray-100 rounded-md"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <ArrowDownCircle className="h-4 w-4 mr-2 text-green-500" />
                  Total Raised
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">₦{financialSummary?.totalRaised.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Gross amount from all collections</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Percent className="h-4 w-4 mr-2 text-orange-500" />
                  Total Charges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">₦{((financialSummary?.totalPlatformCharges || 0) + (financialSummary?.totalGatewayFees || 0)).toLocaleString()}</p>
                <div className="text-sm text-gray-500">
                  <div>Platform: ₦{financialSummary?.totalPlatformCharges.toLocaleString() || '0'}</div>
                  <div>Gateway: ₦{financialSummary?.totalGatewayFees.toLocaleString() || '0'}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                  Available Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">₦{financialSummary?.currentBalance.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">
                  {financialSummary?.pendingWithdrawals ? `Pending: ₦${financialSummary.pendingWithdrawals.toLocaleString()}` : 'Ready to withdraw'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <ArrowUpCircle className="h-4 w-4 mr-2 text-purple-500" />
                  Total Withdrawn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">₦{financialSummary?.totalWithdrawn.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">Successfully withdrawn funds</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Earnings per Collection</CardTitle>
              <CardDescription>
                Platform charges are calculated based on tiers: &lt;₦1,000 (3%), ₦1,000-₦4,999 (2.5%), ₦5,000-₦19,999 (2%), ≥₦20,000 (1.5%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collectionEarnings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collection</TableHead>
                      <TableHead>Per Person</TableHead>
                      <TableHead>Total Raised</TableHead>
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
                <div className="text-center py-6 text-gray-500">
                  <p>No collections found</p>
                  <p className="text-sm mt-2">Once you create collections and receive payments, they will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <TransactionLogs transactions={formattedTransactions} />
        </>
      )}
      
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

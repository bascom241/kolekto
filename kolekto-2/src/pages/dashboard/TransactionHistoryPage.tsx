import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { WithdrawFundsDialog } from "@/components/withdrawals/WithdrawFundsDialog";
import { toast } from "sonner";
import TransactionLogs from "@/components/dashboard/TransactionLogs";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/store/useTransaction";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Collection {
  id: string;
  title: string;
  amount: number;
  total_raised: number;
  participants_count: number;
}

interface Transaction {
  id: string;
  type: "withdrawal" | "contribution" | "refund" | "payment";
  status: "pending" | "successful" | "failed";
  amount: number;
  date: string;
  collection?: string;
  description?: string;
  contributor?: string;
}

const TransactionHistoryPage: React.FC = () => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const { user } = useAuth();
  const {
    fetchCollections,
    fetchPayments,
    fetchWithdrawals,
    submitWithdrawal
  } = useTransactions();

  const [collections, setCollections] = useState<Collection[]>([]);
  interface Payment {
    id: string;
    status: "pending" | "successful" | "failed";
    amount: number;
    created_at: string;
    collection?: string;
    contributor?: {
      name: string;
      email: string;
    };
  }

  const [payments, setPayments] = useState<Payment[]>([]);
  interface Withdrawal {
    id: string;
    status: "pending" | "successful" | "failed";
    amount: number;
    created_at: string;
    reason_if_failed?: string;
    collections?: {
      title: string;
    };
  }

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState({
    collections: false,
    payments: false,
    withdrawals: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(prev => ({ ...prev, collections: true }));
        const collectionsResponse = await fetchCollections(user.id);
        if (collectionsResponse.error) throw new Error(collectionsResponse.error);
        setCollections(
          collectionsResponse.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            amount: item.amount,
            total_raised: item.total_raised,
            participants_count: item.participants_count || 0, // Ensure participants_count is present
          }))
        );

        setLoading(prev => ({ ...prev, payments: true }));
        const paymentsResponse = await fetchPayments(user.id);
        if (paymentsResponse.error) throw new Error(paymentsResponse.error);
        setPayments(paymentsResponse.data);

        setLoading(prev => ({ ...prev, withdrawals: true }));
        const withdrawalsResponse = await fetchWithdrawals(user.id);
        if (withdrawalsResponse.error) throw new Error(withdrawalsResponse.error);
        setWithdrawals(withdrawalsResponse.data);

      } catch (err: any) {
        setError(err.message || "Failed to load transaction data");
        toast.error(err.message || "Failed to load transaction data");
      } finally {
        setLoading({
          collections: false,
          payments: false,
          withdrawals: false
        });
      }
    };

    loadData();
  }, [user?.id]);

  // Calculate total earnings (90% of total raised across all collections)
  const totalEarnings = collections.reduce((sum, collection) => {
    return sum + (collection.total_raised || 0) * 0.9;
  }, 0);

  // Prepare collection earnings data
  const collectionEarnings = collections.map(collection => ({
    id: collection.id,
    title: collection.title,
    amount: collection.amount,
    total_raised: collection.total_raised || 0,
    participants_count: collection.participants_count || 0,
    withdrawable: (collection.total_raised || 0) * 0.9
  }));

  // Format transactions data for TransactionLogs component
  const formatTransactions = (): Transaction[] => {
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      type: "payment" as const,
      status: payment.status,
      amount: payment.amount,
      date: payment.created_at,
      collection: payment.collection || "Unknown Collection",
      contributor: payment.contributor 
        ? `${payment.contributor.name} (${payment.contributor.email})`
        : "Unknown"
    }));

    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id,
      type: "withdrawal" as const,
      status: withdrawal.status,
      amount: withdrawal.amount,
      date: withdrawal.created_at,
      description: withdrawal.reason_if_failed,
      collection: withdrawal.collections?.title || "Unknown Collection"
    }));

    return [...formattedPayments, ...formattedWithdrawals].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const handleWithdraw = (collection: Collection) => {
    setSelectedCollection(collection);
    setIsWithdrawDialogOpen(true);
  };

  const handleWithdrawalSubmit = async (data: {
    amount: number;
    accountName: string;
    accountNumber: string;
    bankName: string;
  }) => {
    if (!user?.id || !selectedCollection) {
      toast.error("Unable to process withdrawal");
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

      toast.success("Withdrawal request submitted");
      setIsWithdrawDialogOpen(false);
      
      // Refresh withdrawals data
      setLoading(prev => ({ ...prev, withdrawals: true }));
      const withdrawalsResponse = await fetchWithdrawals(user.id);
      if (withdrawalsResponse.error) throw new Error(withdrawalsResponse.error);
      setWithdrawals(withdrawalsResponse.data);
      setLoading(prev => ({ ...prev, withdrawals: false }));

    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    }
  };

  const isLoading = loading.collections || loading.payments || loading.withdrawals;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading transaction history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transaction History</h1>

      {/* Total Earnings Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Withdrawable Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            ₦{totalEarnings.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Total amount available for withdrawal (90% of total collected)
          </p>
        </CardContent>
      </Card>

      {/* Collections Earnings Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Collection Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collection</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Total Collected</TableHead>
                <TableHead>Withdrawable</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collectionEarnings.length > 0 ? (
                collectionEarnings.map(collection => (
                  <TableRow key={collection.id}>
                    <TableCell className="font-medium">{collection.title}</TableCell>
                    <TableCell>₦{collection.amount.toLocaleString()}</TableCell>
                    <TableCell>{collection.participants_count}</TableCell>
                    <TableCell>₦{collection.total_raised.toLocaleString()}</TableCell>
                    <TableCell>₦{collection.withdrawable.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWithdraw({
                          id: collection.id,
                          title: collection.title,
                          amount: collection.amount,
                          total_raised: collection.total_raised,
                          participants_count: collection.participants_count
                        })}
                        disabled={collection.withdrawable <= 0}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Withdraw
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No collections found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionLogs transactions={formatTransactions()} />
        </CardContent>
      </Card>

      {/* Withdrawal Dialog */}
      {selectedCollection && (
        <WithdrawFundsDialog
          open={isWithdrawDialogOpen}
          onOpenChange={setIsWithdrawDialogOpen}
          onComplete={handleWithdrawalSubmit}
          availableBalance={selectedCollection.total_raised * 0.9}
          collectionId={selectedCollection.id}
          collectionTitle={selectedCollection.title}
        />
      )}
    </div>
  );
};

export default TransactionHistoryPage;
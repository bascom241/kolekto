import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { WithdrawFundsDialog } from "@/components/withdrawals/WithdrawFundsDialog";
import { toast } from "sonner";
import TransactionLogs from "@/components/dashboard/TransactionLogs";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/store/useTransaction";
import { Loader2 } from "lucide-react";
interface Transaction {
  type: "withdrawal" | "contribution" | "refund" | "payment";
  // other properties...
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: string;
  type: "withdrawal" | "contribution" | "refund" | "payment";
  status: "pending" | "successful" | "failed";
  amount: number;
  date: string;
  collection: string;
  description?: string;
  contributor?: string;
}

interface Collection {
  id: string;
  title: string;
  amount: number;
  total_raised: number;
}

interface Withdrawal {
  id: string;
  status: "pending" | "successful" | "failed";
  amount: number;
  created_at: string;
  collections?: { title: string };
  reason_if_failed?: string;
}

interface Payment {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  amount: number;
  paymentReference: string;
  status: "pending" | "successful" | "failed";
  contributor: { name: string; email: string } | null;
  collection: string;
  created_at: string;
}

const TransactionHistoryPage: React.FC = () => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const { user } = useAuth();
  const { fetchCollections, fetchPayments, fetchWithdrawals, submitWithdrawal } = useTransactions();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setError("User not authenticated");
        return;
      }

      // Fetch collections
      setCollectionsLoading(true);
      const collectionsResult = await fetchCollections(user.id);
      setCollections(collectionsResult.data);
      if (collectionsResult.error) setError((prev) => prev || collectionsResult.error);
      setCollectionsLoading(false);

      // Fetch payments
      setPaymentsLoading(true);
      const paymentsResult = await fetchPayments(user.id);
      setPayments(paymentsResult.data);
      if (paymentsResult.error) setError((prev) => prev || paymentsResult.error);
      setPaymentsLoading(false);

      // Fetch withdrawals
      setWithdrawalsLoading(true);
      const withdrawalsResult = await fetchWithdrawals(user.id);
      setWithdrawals(withdrawalsResult.data);
      if (withdrawalsResult.error) setError((prev) => prev || withdrawalsResult.error);
      setWithdrawalsLoading(false);
    };

    loadData();
  }, [user?.id, fetchCollections, fetchPayments, fetchWithdrawals]);

  // Calculate total earnings across all collections based on their actual total_raised value
  const totalEarnings = collections.reduce((total, collection) => {
    return total + (collection.total_raised || 0);
  }, 0);

  // Prepare collection earnings data for the table using the actual total_raised values
  const collectionEarnings = collections.map((collection) => {
    // Calculate withdrawable amount (90% of total raised)
    const withdrawable = (collection.total_raised || 0) * 0.9;

    return {
      id: collection.id,
      title: collection.title,
      amount: collection.amount,
      total_raised: collection.total_raised || 0,
      totalCollected: collection.total_raised || 0,
      withdrawable,
    };
  });

  // Process payment data for the transaction logs
  const formattedPayments: Transaction[] = payments.map((payment) => ({
    id: payment.id,
    type: "payment",
    status: payment.status,
    amount: payment.amount,
    date: payment.created_at,
    collection: payment.collection,
    contributor: payment.contributor
      ? `${payment.contributor.name} (${payment.contributor.email})`
      : "Unknown",
  }));

  // Process withdrawal data for the transaction logs
  const formattedWithdrawals: Transaction[] = withdrawals.map((withdrawal) => ({
    id: withdrawal.id,
    type: "withdrawal",
    status: withdrawal.status,
    amount: withdrawal.amount,
    date: withdrawal.created_at,
    collection: withdrawal.collections?.title || "Unknown Collection",
    description: withdrawal.reason_if_failed,
  }));

  // Combine payments and withdrawals, sort by date (newest first)
  const allTransactions = [...formattedPayments, ...formattedWithdrawals].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleWithdraw = (collection: Collection) => {
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
      toast.error("Unable to process withdrawal. Please try again.");
      return;
    }

    try {
      await submitWithdrawal({
        organizer_id: user.id,
        collection_id: selectedCollection.id,
        amount: data.amount,
        account_name: data.accountName,
        account_number: data.accountNumber,
        bank_name: data.bankName,
      });

      setIsWithdrawDialogOpen(false);
      // Refresh withdrawals
      setWithdrawalsLoading(true);
      const withdrawalsResult = await fetchWithdrawals(user.id);
      setWithdrawals(withdrawalsResult.data);
      setWithdrawalsLoading(false);
      toast.success("Withdrawal request submitted successfully");
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast.error(error.message || "Failed to submit withdrawal request");
    }
  };

  const isLoading = collectionsLoading || paymentsLoading || withdrawalsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mr-2" />
        <p className="text-gray-500">Loading transaction data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-gray-500">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Error Loading Transactions</h2>
        <p className="text-gray-600 mb-6">
          Failed to load transaction data: {error}. Please try again or contact support.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-kolekto hover:bg-kolekto/90"
        >
          Retry
        </Button>
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
                {collectionEarnings.map((collection) => (
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

      <TransactionLogs transactions={allTransactions.filter((transaction): transaction is Transaction & { type: "withdrawal" | "contribution" | "refund" } => transaction.type !== "payment")} />

      {selectedCollection && (
        <WithdrawFundsDialog
          open={isWithdrawDialogOpen}
          onOpenChange={setIsWithdrawDialogOpen}
          onComplete={onWithdrawComplete}
          availableBalance={(selectedCollection.total_raised || 0) * 0.9}
          collectionId={selectedCollection.id}
          collectionTitle={selectedCollection.title}
        />
      )}
    </div>
  );
};

export default TransactionHistoryPage;
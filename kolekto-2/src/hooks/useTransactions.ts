
import { useCollections } from './useCollections';
import { useContributionData } from './useContributionData';
import { useDashboardData } from './useDashboardData';
import { useWithdrawalData } from './useWithdrawalData';
import { useTransactionData } from './useTransactionData';

export const useTransactions = () => {
  const collections = useCollections();
  const contributions = useContributionData();
  const dashboard = useDashboardData();
  const withdrawals = useWithdrawalData();
  const transactions = useTransactionData();

  return {
    // Collections
    useCollectionsList: collections.useCollectionsList,
    useCollectionById: collections.useCollectionById,
    
    // Contributions
    useContributionsList: contributions.useContributionsList,
    
    // Dashboard data
    useDashboardStats: dashboard.useDashboardStats,
    useRecentPayments: dashboard.useRecentPayments,
    
    // Withdrawals
    useWithdrawalsList: withdrawals.useWithdrawalsList,
    submitWithdrawal: withdrawals.submitWithdrawal,
    
    // Transactions
    useTransactionsList: transactions.useTransactionsList,
    useFinancialSummary: transactions.useFinancialSummary
  };
};

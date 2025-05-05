
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { shouldRetryQuery, DEFAULT_STALE_TIME, calculatePlatformChargePercentage, calculateGatewayFee, calculateTotalCharges } from '@/utils/dbHelpers';

export const useTransactionData = () => {
  // Fetch transactions with pagination
  const getTransactions = async (userId?: string, collectionId?: string, page = 1, pageSize = 20) => {
    if (!userId && !collectionId) {
      console.warn('No userId or collectionId provided for getTransactions');
      return { data: [], count: 0 };
    }
    
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          collections (title, total_amount)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (collectionId) {
        query = query.eq('collection_id', collectionId);
      }

      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      // Also fetch withdrawal data to link with transactions
      let withdrawals = [];
      if (data && data.some(t => t.withdrawal_id)) {
        const withdrawalIds = data
          .filter(t => t.withdrawal_id)
          .map(t => t.withdrawal_id);
          
        if (withdrawalIds.length > 0) {
          const { data: withdrawalData } = await supabase
            .from('withdrawals')
            .select('id, status')
            .in('id', withdrawalIds);
            
          if (withdrawalData) {
            withdrawals = withdrawalData;
          }
        }
      }

      return {
        data: data?.map(transaction => {
          // Calculate fees based on transaction type
          const { platformCharge, gatewayFee } = transaction.type === 'contribution' 
            ? calculateTotalCharges(transaction.amount)
            : { platformCharge: 0, gatewayFee: 0 };
            
          // Get withdrawal status if it's a withdrawal transaction
          const withdrawalStatus = transaction.withdrawal_id 
            ? withdrawals.find(w => w.id === transaction.withdrawal_id)?.status || 'pending'
            : undefined;
            
          return {
            ...transaction,
            formattedAmount: formatCurrency(transaction.amount),
            formattedDate: formatDate(transaction.created_at),
            platformCharge,
            gatewayFee,
            netAmount: transaction.type === 'contribution' 
              ? transaction.amount - (platformCharge + gatewayFee)
              : transaction.amount,
            withdrawalStatus
          };
        }) || [],
        count: count || 0
      };
    } catch (err) {
      console.error('Transaction fetch error:', err);
      throw err;
    }
  };

  // Get summary of financial metrics
  const getFinancialSummary = async (userId?: string, collectionId?: string) => {
    if (!userId && !collectionId) {
      return {
        totalRaised: 0,
        totalPlatformCharges: 0,
        totalGatewayFees: 0,
        withdrawableBalance: 0,
        totalWithdrawn: 0,
        currentBalance: 0,
        pendingWithdrawals: 0
      };
    }
    
    try {
      // Get all collections
      let collectionsQuery = supabase
        .from('collections')
        .select('id, title, amount, total_amount');
        
      if (userId) {
        collectionsQuery = collectionsQuery.eq('organizer_id', userId);
      }
      
      if (collectionId) {
        collectionsQuery = collectionsQuery.eq('id', collectionId);
      }
      
      const { data: collections, error: collectionsError } = await collectionsQuery;
      
      if (collectionsError) {
        throw collectionsError;
      }
      
      if (!collections?.length) {
        return {
          totalRaised: 0,
          totalPlatformCharges: 0,
          totalGatewayFees: 0,
          withdrawableBalance: 0,
          totalWithdrawn: 0,
          currentBalance: 0,
          pendingWithdrawals: 0
        };
      }
      
      const collectionIds = collections.map(c => c.id);
      
      // Get successful contributions
      const { data: contributions, error: contributionsError } = await supabase
        .from('contributions')
        .select('amount, collection_id')
        .in('collection_id', collectionIds)
        .eq('status', 'paid');
        
      if (contributionsError) {
        throw contributionsError;
      }
      
      // Get withdrawals
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('amount, status')
        .in('collection_id', collectionIds);
        
      if (withdrawalsError) {
        throw withdrawalsError;
      }
      
      // Calculate metrics
      const totalRaised = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      
      let totalPlatformCharges = 0;
      let totalGatewayFees = 0;
      
      // Calculate charges for each contribution
      contributions?.forEach(c => {
        const platformCharge = c.amount * calculatePlatformChargePercentage(c.amount);
        const gatewayFee = calculateGatewayFee(c.amount);
        
        totalPlatformCharges += platformCharge;
        totalGatewayFees += gatewayFee;
      });
      
      const withdrawableBalance = totalRaised - (totalPlatformCharges + totalGatewayFees);
      
      // Calculate completed and pending withdrawals
      const totalWithdrawn = withdrawals
        ?.filter(w => w.status === 'successful' || w.status === 'completed')
        .reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
        
      const pendingWithdrawals = withdrawals
        ?.filter(w => w.status === 'pending' || w.status === 'processing')
        .reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
        
      const currentBalance = withdrawableBalance - (totalWithdrawn + pendingWithdrawals);
      
      return {
        totalRaised,
        totalPlatformCharges,
        totalGatewayFees,
        withdrawableBalance,
        totalWithdrawn,
        currentBalance,
        pendingWithdrawals
      };
    } catch (err) {
      console.error('Financial summary fetch error:', err);
      throw err;
    }
  };

  // Query hooks
  const useTransactionsList = (userId?: string, collectionId?: string, page = 1, pageSize = 20) => {
    return useQuery({
      queryKey: ['transactions', userId, collectionId, page, pageSize],
      queryFn: () => getTransactions(userId, collectionId, page, pageSize),
      enabled: !!userId || !!collectionId, 
      staleTime: DEFAULT_STALE_TIME,
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
      meta: {
        errorMessage: 'Failed to load transactions'
      }
    });
  };
  
  const useFinancialSummary = (userId?: string, collectionId?: string) => {
    return useQuery({
      queryKey: ['financial-summary', userId, collectionId],
      queryFn: () => getFinancialSummary(userId, collectionId),
      enabled: !!userId || !!collectionId,
      staleTime: DEFAULT_STALE_TIME,
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
      meta: {
        errorMessage: 'Failed to load financial summary'
      }
    });
  };

  return {
    useTransactionsList,
    useFinancialSummary
  };
};

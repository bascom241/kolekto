
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { DEFAULT_STALE_TIME } from '@/utils/dbHelpers';

export const useWithdrawalData = () => {
  // Get withdrawal history for a collection or user
  const getWithdrawals = async (userId?: string, collectionId?: string) => {
    try {
      let query = supabase
        .from('withdrawals')
        .select(`
          *,
          collections (title)
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('organizer_id', userId);
      }

      if (collectionId) {
        query = query.eq('collection_id', collectionId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching withdrawals:', error);
        throw error;
      }

      return data?.map(withdrawal => ({
        ...withdrawal,
        formattedAmount: formatCurrency(withdrawal.amount),
        formattedDate: formatDate(withdrawal.created_at),
      })) || [];
    } catch (err) {
      console.error('Withdrawals fetch error:', err);
      throw err;
    }
  };

  // Submit a withdrawal request
  const submitWithdrawal = async (withdrawalData: {
    collection_id?: string;
    organizer_id: string;
    amount: number;
    account_name: string;
    account_number: string;
    bank_name: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .insert(withdrawalData)
        .select()
        .single();
      
      if (error) {
        console.error('Error submitting withdrawal request:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Withdrawal submission error:', err);
      throw err;
    }
  };

  // Query hook
  const useWithdrawalsList = (userId?: string, collectionId?: string) => {
    return useQuery({
      queryKey: ['withdrawals', userId, collectionId],
      queryFn: () => getWithdrawals(userId, collectionId),
      enabled: !!userId || !!collectionId,
      staleTime: DEFAULT_STALE_TIME,
    });
  };

  return {
    useWithdrawalsList,
    submitWithdrawal
  };
};

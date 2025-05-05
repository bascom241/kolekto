
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { DEFAULT_STALE_TIME } from '@/utils/dbHelpers';

export const useWithdrawals = () => {
  const queryClient = useQueryClient();

  // Fetch withdrawals with formatted data
  const getWithdrawals = async (collectionId?: string) => {
    const query = supabase
      .from('withdrawals')
      .select(`
        *,
        collections (title)
      `)
      .order('created_at', { ascending: false });

    if (collectionId) {
      query.eq('collection_id', collectionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data?.map(withdrawal => ({
      ...withdrawal,
      formattedAmount: formatCurrency(withdrawal.amount),
      formattedDate: formatDateTime(withdrawal.created_at),
    }));
  };

  // Create withdrawal
  const createWithdrawal = async (withdrawalData: {
    amount: number;
    collection_id?: string;
    account_name: string;
    account_number: string;
    bank_name: string;
    organizer_id: string;
  }) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert(withdrawalData)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Update withdrawal status
  const updateWithdrawalStatus = async (id: string, updates: {
    status: string;
    reference?: string;
    reason_if_failed?: string;
  }) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Queries and Mutations
  const useWithdrawalsList = (collectionId?: string) => {
    return useQuery({
      queryKey: ['withdrawals', collectionId],
      queryFn: () => getWithdrawals(collectionId),
      staleTime: DEFAULT_STALE_TIME,
    });
  };

  const useCreateWithdrawal = () => {
    return useMutation({
      mutationFn: createWithdrawal,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
        toast.success('Withdrawal request created successfully');
      },
      onError: (error: Error) => {
        toast.error(`Failed to create withdrawal request: ${error.message}`);
      },
    });
  };

  const useUpdateWithdrawalStatus = () => {
    return useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateWithdrawalStatus>[1] }) =>
        updateWithdrawalStatus(id, updates),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
        toast.success('Withdrawal status updated successfully');
      },
      onError: (error: Error) => {
        toast.error(`Failed to update withdrawal status: ${error.message}`);
      },
    });
  };

  return {
    useWithdrawalsList,
    useCreateWithdrawal,
    useUpdateWithdrawalStatus,
  };
};

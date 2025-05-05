
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEFAULT_STALE_TIME, shouldRetryQuery } from '@/utils/dbHelpers';

export const useContributions = () => {
  const queryClient = useQueryClient();

  // Fetch contributions
  const getContributions = async (collectionId?: string) => {
    // Simplified query without joins
    const query = supabase
      .from('contributions')
      .select('id, amount, contributor_name, contributor_email, contributor_phone, created_at, status, payment_method, payment_reference, collection_id')
      .order('created_at', { ascending: false });

    if (collectionId) {
      query.eq('collection_id', collectionId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching contributions:', error);
      throw error;
    }
    return data;
  };

  // Create contribution
  const createContribution = async (contributionData: {
    amount: number;
    collection_id: string;
    contributor_email: string;
    contributor_id: string;
    contributor_name: string;
    contributor_phone?: string;
    payment_method: string;
  }) => {
    const { data, error } = await supabase
      .from('contributions')
      .insert(contributionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Update contribution status
  const updateContributionStatus = async (id: string, status: string, payment_reference?: string) => {
    const { data, error } = await supabase
      .from('contributions')
      .update({ status, payment_reference })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Queries and Mutations
  const useContributionsList = (collectionId?: string) => {
    return useQuery({
      queryKey: ['contributions', collectionId],
      queryFn: () => getContributions(collectionId),
      staleTime: DEFAULT_STALE_TIME,
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
      meta: {
        errorMessage: 'Failed to load contributions'
      }
    });
  };

  const useCreateContribution = () => {
    return useMutation({
      mutationFn: createContribution,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contributions'] });
        toast.success('Contribution created successfully');
      },
      onError: (error: Error) => {
        toast.error(`Failed to create contribution: ${error.message}`);
      },
    });
  };

  const useUpdateContributionStatus = () => {
    return useMutation({
      mutationFn: ({ id, status, payment_reference }: { id: string; status: string; payment_reference?: string }) =>
        updateContributionStatus(id, status, payment_reference),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contributions'] });
        toast.success('Contribution status updated successfully');
      },
      onError: (error: Error) => {
        toast.error(`Failed to update contribution status: ${error.message}`);
      },
    });
  };

  return {
    useContributionsList,
    useCreateContribution,
    useUpdateContributionStatus,
  };
};

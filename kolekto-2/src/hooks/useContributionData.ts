
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { shouldRetryQuery, DEFAULT_STALE_TIME, isAuthenticated, getAuthenticatedUser, handleAnonymousAccess } from '@/utils/dbHelpers';
import { toast } from 'sonner';

export const useContributionData = () => {
  // Get contributions for a collection with detailed information
  const getContributions = async (collectionId?: string) => {
    if (!collectionId) {
      console.warn('No collectionId provided for getContributions');
      return [];
    }
    
    try {
      // First check if we're accessing a public collection (for contribution pages)
      const isPublicAccess = await handleAnonymousAccess(collectionId);
      
      // For dashboard views, check authentication
      if (!isPublicAccess) {
        // Check if user is authenticated
        const user = await getAuthenticatedUser();
        if (!user) {
          console.warn('User is not authenticated. Authentication is required to access contributions.');
          toast.error('Authentication required to view contributions');
          return [];
        }
        
        // Get collections to verify user has access
        const { data: collections, error: collectionsError } = await supabase
          .from('collections')
          .select('id, organizer_id')
          .eq('id', collectionId)
          .single();
          
        if (collectionsError) {
          console.error('Error checking collection access:', collectionsError);
          throw collectionsError;
        }
        
        // Verify user is the organizer
        if (collections.organizer_id !== user.id) {
          console.warn('User does not have permission to access these contributions');
          toast.error('You do not have permission to view these contributions');
          return [];
        }
      }
      
      // Query contributions table with the verified permission
      const { data, error } = await supabase
        .from('contributions')
        .select('id, amount, contributor_name, contributor_email, contributor_phone, created_at, status, payment_method, payment_reference')
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching contributions:', error);
        throw error;
      }
      
      return data?.map(contribution => ({
        ...contribution,
        formattedAmount: formatCurrency(contribution.amount),
        formattedDate: formatDate(contribution.created_at),
      })) || [];
    } catch (err) {
      console.error('Contributions fetch error:', err);
      throw err;
    }
  };

  // Query hook
  const useContributionsList = (collectionId?: string) => {
    return useQuery({
      queryKey: ['contributions', collectionId],
      queryFn: () => getContributions(collectionId),
      enabled: !!collectionId,
      staleTime: DEFAULT_STALE_TIME,
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
      meta: {
        errorMessage: 'Failed to load contributions'
      }
    });
  };

  return {
    useContributionsList
  };
};

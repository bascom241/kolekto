
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { shouldRetryQuery, DEFAULT_STALE_TIME, isAuthenticated } from '@/utils/dbHelpers';
import { toast } from 'sonner';

export const useCollections = () => {
  // Get collections with real-time participants count
  const getCollections = async (userId?: string) => {
    try {
      if (!userId) {
        console.warn('No userId provided for getCollections');
        return [];
      }
      
      // Check if user is authenticated
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        console.warn('User is not authenticated. Authentication is required to access collections.');
        toast.error('Authentication required to view collections');
        return [];
      }
      
      console.log('Fetching collections for user:', userId);
      
      // First get all collections
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select(`*`)
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false });
      
      if (collectionsError) {
        console.error('Error fetching collections:', collectionsError);
        throw collectionsError;
      }
      
      if (!collections?.length) {
        return [];
      }

      // Then enhance collections with additional information
      const enhancedCollections = await Promise.all(collections.map(async (collection) => {
        try {
          // For each collection, perform separate queries to avoid permission issues
          let participantsCount = 0;
          let totalAmountRaised = 0;
          
          try {
            // Get participants count
            const { data: paidContributions, error: countError } = await supabase
              .from('contributions')
              .select('id, amount')
              .eq('collection_id', collection.id)
              .eq('status', 'paid');
            
            if (!countError && paidContributions) {
              participantsCount = paidContributions.length;
              totalAmountRaised = paidContributions.reduce((sum, contribution) => 
                sum + (contribution.amount || 0), 0);
            }
          } catch (err) {
            console.error(`Error calculating stats for collection ${collection.id}:`, err);
          }
          
          return {
            ...collection,
            participants_count: participantsCount,
            total_raised: totalAmountRaised,
            formattedAmount: formatCurrency(collection.amount),
            formattedTotalRaised: formatCurrency(totalAmountRaised),
            formattedDeadline: collection.deadline ? formatDate(collection.deadline) : '',
          };
        } catch (err) {
          console.error(`Error processing collection ${collection.id}:`, err);
          return {
            ...collection,
            participants_count: 0,
            total_raised: 0,
            formattedAmount: formatCurrency(collection.amount),
            formattedTotalRaised: formatCurrency(0),
            formattedDeadline: collection.deadline ? formatDate(collection.deadline) : '',
          };
        }
      }));
      
      console.log('Enhanced collections:', enhancedCollections);
      return enhancedCollections;
    } catch (err) {
      console.error('Collections fetch error:', err);
      throw err;
    }
  };

  // Get a single collection by ID with full details
  const getCollectionById = async (collectionId?: string) => {
    if (!collectionId) {
      console.warn('No collectionId provided for getCollectionById');
      return null;
    }
    
    // Check if user is authenticated
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      console.warn('User is not authenticated. Authentication is required to access collection details.');
      toast.error('Authentication required to view collection details');
      return null;
    }
    
    console.log('Fetching collection with ID:', collectionId);
    
    try {
      // First get the collection details
      const { data: collection, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single();
      
      if (error) {
        console.error('Error fetching collection by ID:', error);
        throw error;
      }
      
      if (!collection) {
        console.warn(`Collection with ID ${collectionId} not found`);
        return null;
      }
      
      // Get stats in a separate query to avoid permission issues
      let participantsCount = 0;
      let totalAmountRaised = 0;
      
      try {
        // Get paid contributions for this collection
        const { data: paidContributions, error: contributionsError } = await supabase
          .from('contributions')
          .select('id, amount')
          .eq('collection_id', collectionId)
          .eq('status', 'paid');
        
        if (!contributionsError && paidContributions) {
          participantsCount = paidContributions.length;
          totalAmountRaised = paidContributions.reduce((sum, contribution) => 
            sum + (contribution.amount || 0), 0);
        }
      } catch (err) {
        console.error(`Error calculating stats for collection ${collectionId}:`, err);
      }
      
      return {
        ...collection,
        participants_count: participantsCount,
        total_raised: totalAmountRaised,
        formattedAmount: formatCurrency(collection.amount),
        formattedTotalRaised: formatCurrency(totalAmountRaised),
        formattedDeadline: collection.deadline ? formatDate(collection.deadline) : '',
      };
    } catch (err) {
      console.error('Collection fetch error:', err);
      throw err;
    }
  };

  // Queries
  const useCollectionsList = (userId?: string) => {
    return useQuery({
      queryKey: ['collections', userId],
      queryFn: () => getCollections(userId),
      enabled: !!userId, 
      staleTime: DEFAULT_STALE_TIME,
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
      meta: {
        errorMessage: 'Failed to load collections'
      }
    });
  };

  const useCollectionById = (collectionId?: string) => {
    return useQuery({
      queryKey: ['collection', collectionId],
      queryFn: () => getCollectionById(collectionId),
      enabled: !!collectionId,
      staleTime: DEFAULT_STALE_TIME,
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
      meta: {
        errorMessage: 'Failed to load collection details'
      }
    });
  };

  return {
    useCollectionsList,
    useCollectionById
  };
};

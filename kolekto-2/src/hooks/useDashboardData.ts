
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isNetworkError, shouldRetryQuery, DEFAULT_STALE_TIME, isAuthenticated } from '@/utils/dbHelpers';
import { toast } from 'sonner';

export const useDashboardData = () => {
  // Get dashboard statistics for a user
  const getDashboardStats = async (userId?: string) => {
    if (!userId) {
      console.warn('No userId provided for getDashboardStats');
      return {
        totalCollections: 0,
        activeCollections: 0,
        totalParticipants: 0,
        totalAmount: 0,
      };
    }
    
    // Check if user is authenticated
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      console.warn('User is not authenticated. Authentication is required to access dashboard stats.');
      return {
        totalCollections: 0,
        activeCollections: 0,
        totalParticipants: 0,
        totalAmount: 0,
      };
    }
    
    try {
      // Get total collections count
      const { count: totalCollections, error: collectionsError } = await supabase
        .from('collections')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', userId);
      
      if (collectionsError) {
        console.error('Error fetching total collections:', collectionsError);
      }
      
      // Get active collections count
      const { count: activeCollections, error: activeError } = await supabase
        .from('collections')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', userId)
        .eq('status', 'active');
      
      if (activeError) {
        console.error('Error fetching active collections:', activeError);
      }
      
      // Get collections IDs for this user
      const { data: userCollections, error: userCollectionsError } = await supabase
        .from('collections')
        .select('id')
        .eq('organizer_id', userId);
      
      if (userCollectionsError) {
        console.error('Error fetching user collections:', userCollectionsError);
        return {
          totalCollections: totalCollections || 0,
          activeCollections: activeCollections || 0,
          totalParticipants: 0,
          totalAmount: 0,
        };
      }
      
      if (!userCollections?.length) {
        return {
          totalCollections: totalCollections || 0,
          activeCollections: activeCollections || 0,
          totalParticipants: 0,
          totalAmount: 0,
        };
      }
      
      const collectionIds = userCollections.map(col => col.id);
      
      // Use a single query to get all contributions across all collections
      let totalParticipants = 0;
      let totalAmount = 0;
      
      try {
        // Get all paid contributions across all user's collections
        const { data: allContributions, error: contributionsError } = await supabase
          .from('contributions')
          .select('collection_id, amount')
          .in('collection_id', collectionIds)
          .eq('status', 'paid');
        
        if (contributionsError) {
          console.error('Error fetching contributions for dashboard stats:', contributionsError);
        } else if (allContributions) {
          // Count unique participants and sum amounts
          totalParticipants = allContributions.length;
          totalAmount = allContributions.reduce((sum, contribution) => 
            sum + (contribution.amount || 0), 0);
        }
      } catch (err) {
        console.error('Error calculating dashboard stats:', err);
      }
      
      return {
        totalCollections: totalCollections || 0,
        activeCollections: activeCollections || 0,
        totalParticipants,
        totalAmount,
      };
    } catch (err) {
      console.error('Dashboard stats fetch error:', err);
      throw err;
    }
  };

  // Get recent payments activity for dashboard
  const getRecentPayments = async (userId?: string, limit = 5) => {
    if (!userId) {
      console.warn('No userId provided for getRecentPayments');
      return [];
    }
    
    // Check if user is authenticated
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      console.warn('User is not authenticated. Authentication is required to access payment data.');
      return [];
    }
    
    try {
      // First get the user's collections
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('id, title')
        .eq('organizer_id', userId);
      
      if (collectionsError) {
        console.error('Error fetching user collections:', collectionsError);
        throw collectionsError;
      }
      
      if (!collections?.length) {
        return [];
      }
      
      const collectionIds = collections.map(col => col.id);
      const collectionsMap = collections.reduce((map, col) => {
        map[col.id] = col.title;
        return map;
      }, {} as Record<string, string>);
      
      // Get all recent paid contributions across all collections
      const { data: payments, error: paymentsError } = await supabase
        .from('contributions')
        .select('id, contributor_name, contributor_email, contributor_phone, amount, created_at, collection_id')
        .in('collection_id', collectionIds)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }
      
      if (!payments?.length) {
        return [];
      }
      
      // Map the data to the expected format
      return payments.map(payment => ({
        id: payment.id,
        name: payment.contributor_name,
        email: payment.contributor_email,
        amount: payment.amount,
        date: payment.created_at,
        collection: collectionsMap[payment.collection_id] || 'Unknown Collection',
        phone: payment.contributor_phone,
      }));
    } catch (err) {
      console.error('Recent payments fetch error:', err);
      throw err;
    }
  };
  
  // Queries
  const useDashboardStats = (userId?: string) => {
    return useQuery({
      queryKey: ['dashboard-stats', userId],
      queryFn: () => getDashboardStats(userId),
      enabled: !!userId,
      staleTime: DEFAULT_STALE_TIME,
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
      meta: {
        errorMessage: 'Failed to load dashboard stats'
      }
    });
  };

  const useRecentPayments = (userId?: string, limit = 5) => {
    return useQuery({
      queryKey: ['recent-payments', userId, limit],
      queryFn: () => getRecentPayments(userId, limit),
      enabled: !!userId,
      staleTime: 1000 * 60, // 1 minute
      retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
      meta: {
        errorMessage: 'Failed to load recent payment data'
      }
    });
  };

  return {
    useDashboardStats,
    useRecentPayments
  };
};

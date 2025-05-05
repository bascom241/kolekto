
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to handle common error retry logic for queries
 */
export const shouldRetryQuery = (failureCount: number, error: any) => {
  // Don't retry if it's a permission issue or too many attempts
  if (error?.message?.includes('permission denied') || 
      error?.code === '42501' ||
      error?.message?.includes('not found') || 
      error?.message?.includes('permission') ||
      error?.message?.includes('JWT') ||
      failureCount >= 3) {
    return false;
  }
  return true;
};

/**
 * Helper function to check if an error is a network error
 */
export const isNetworkError = (error: any) => {
  return (
    error instanceof Error && 
    (error.message.includes('Failed to fetch') || 
     error.message.includes('NetworkError') ||
     error.message.includes('network') ||
     error.message.includes('timeout') ||
     error.message.includes('abort') ||
     !navigator.onLine)
  );
};

/**
 * Default stale time for queries (2 minutes)
 */
export const DEFAULT_STALE_TIME = 1000 * 60 * 2;

/**
 * Helper to safely handle permission errors
 */
export const handlePermissionError = (error: any) => {
  if (error?.code === '42501' || 
      error?.message?.includes('permission denied') ||
      error?.message?.includes('JWT')) {
    console.warn('Permission denied, this is likely due to RLS policies. Make sure you are authenticated.');
    return true;
  }
  return false;
};

/**
 * Helper to check if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Error checking authentication status:', error);
      return false;
    }
    return !!data.session;
  } catch (err) {
    console.error('Authentication check failed:', err);
    return false;
  }
};

/**
 * Get authenticated user details
 */
export const getAuthenticatedUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('Error getting authenticated user:', error);
      return null;
    }
    return data.user;
  } catch (err) {
    console.error('Failed to get authenticated user:', err);
    return null;
  }
};

/**
 * Helper to determine if an error is related to database connection
 */
export const isDatabaseConnectionError = (error: any) => {
  return (
    error?.message?.includes('connection') ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('database')
  );
};

/**
 * Helper to handle anonymous access to protected resources
 */
export const handleAnonymousAccess = async (collectionId?: string) => {
  // For anonymous flows like public contribution pages
  if (collectionId) {
    // Check if the collection exists and is active without requiring auth
    const { data } = await supabase
      .from('collections')
      .select('id, status')
      .eq('id', collectionId)
      .eq('status', 'active')
      .single();
      
    return !!data;
  }
  return false;
};

/**
 * Calculate platform charge based on tier system
 * @param amount The total amount raised
 * @returns Platform charge percentage as a decimal (e.g., 0.03 for 3%)
 */
export const calculatePlatformChargePercentage = (amount: number): number => {
  if (amount < 1000) {
    return 0.03; // 3%
  } else if (amount < 5000) {
    return 0.025; // 2.5%
  } else if (amount < 20000) {
    return 0.02; // 2%
  } else {
    return 0.015; // 1.5%
  }
};

/**
 * Calculate gateway fee
 * @param amount The transaction amount
 * @returns Gateway fee (1.5% with max cap of ₦2,000)
 */
export const calculateGatewayFee = (amount: number): number => {
  const fee = amount * 0.015; // 1.5%
  return Math.min(fee, 2000); // Cap at ₦2,000
};

/**
 * Calculate total charges (platform + gateway)
 * @param amount The total amount raised
 * @returns Total charges (platform charge + gateway fee)
 */
export const calculateTotalCharges = (amount: number): {
  platformCharge: number;
  gatewayFee: number;
  totalCharge: number;
} => {
  const platformCharge = amount * calculatePlatformChargePercentage(amount);
  const gatewayFee = calculateGatewayFee(amount);
  return {
    platformCharge,
    gatewayFee,
    totalCharge: platformCharge + gatewayFee
  };
};

/**
 * Calculate withdrawable amount
 * @param amount The total amount raised
 * @returns Withdrawable amount (Total - Charges)
 */
export const calculateWithdrawableAmount = (amount: number): number => {
  const { totalCharge } = calculateTotalCharges(amount);
  return amount - totalCharge;
};


import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isNetworkError } from '@/utils/dbHelpers';

export interface PaystackMetadata {
  collectionId: string;
  participants: any[];
  custom_fields?: any[];
  collectionTitle?: string;
}

export interface PaystackVerificationResponse {
  status: string;
  data?: any;
  message?: string;
}

export const usePaystack = () => {
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = async (
    email: string,
    amount: number,
    metadata: PaystackMetadata
  ) => {
    setIsLoading(true);

    try {
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('A valid email address is required');
      }

      if (!amount || isNaN(Number(amount))) {
        throw new Error('A valid amount is required');
      }

      if (!metadata || typeof metadata !== 'object' || !metadata.collectionId) {
        throw new Error('Valid collection information is required');
      }

      // Ensure custom_fields exists in metadata
      if (!metadata.custom_fields) {
        metadata.custom_fields = [];
      }

      // Convert amount to kobo (multiply by 100)
      const amountInKobo = Math.round(amount * 100);

      const payload = {
        email,
        amount: amountInKobo,
        metadata,
      };

      console.log('Initiating payment with:', payload);

      // Add a timeout for the function call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
      });

      const functionPromise = supabase.functions.invoke('initiate-paystack-payment', {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json', // Ensure proper content type
        }
      });

      // Race the function call against the timeout
      const { data, error } = await Promise.race([
        functionPromise,
        timeoutPromise.then(() => ({ data: null, error: new Error('Request timed out') })),
      ]) as { data: any; error: any };

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);

        // Handle specific error messages from the edge function
        let errorMessage = 'Failed to connect to payment service';

        if (isNetworkError(error)) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (error.message?.includes('Server configuration error')) {
          errorMessage = 'Payment system is not properly configured. Please contact support.';
        } else if (error.message?.includes('Invalid response from payment gateway')) {
          errorMessage = 'Payment gateway returned an unexpected response. Please try again or contact support.';
        } else if (error.message?.includes('Invalid or unauthorized Paystack API key')) {
          errorMessage = 'Payment system authentication failed. Please contact support.';
        } else if (error.message?.includes('Paystack server error')) {
          errorMessage = 'Payment gateway is experiencing issues. Please try again later.';
        } else if (error.message?.includes('Invalid payment gateway configuration')) {
          errorMessage = 'Payment system is misconfigured. Please contact support.';
        } else if (error.message?.includes('Too many payment requests')) {
          errorMessage = 'Too many payment attempts. Please wait a moment and try again.';
        } else if (error.message?.includes('Access denied')) {
          errorMessage = 'Payment gateway access denied. Please contact support.';
        } else if (error.message?.includes('non-JSON response')) {
          errorMessage = 'Payment gateway returned an invalid response. Please try again later.';
        } else if (error.message?.includes('Failed to connect to payment service after')) {
          errorMessage = 'Payment service is temporarily unavailable. Please try again later.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }

      if (!data) {
        console.error('No data returned from payment service');
        throw new Error('No response from payment service');
      }

      return data;
    } catch (error: any) {
      console.error('Payment error details:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      });
      toast.error(`Payment initialization failed: ${error.message || 'An unexpected error occurred'}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (reference: string): Promise<PaystackVerificationResponse> => {
    setIsLoading(true);

    try {
      if (!reference || typeof reference !== 'string') {
        throw new Error('A valid payment reference is required');
      }

      console.log('Verifying payment with reference:', reference);

      const payload = { reference };
      console.log('Verification payload:', payload);

      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json', // Ensure proper content type
        }
      });

      console.log('Payment verification response:', { data, error });

      if (error) {
        console.error('Verification function error:', error);
        let errorMessage = 'Failed to verify payment';

        if (isNetworkError(error)) {
          errorMessage = 'Network connection error. Please check your internet connection.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }

      if (!data) {
        console.error('No data returned from verification service');
        return { status: 'error', message: 'No response from verification service' };
      }

      if (!data.status) {
        return { ...data, status: 'success' };
      }

      return data;
    } catch (error: any) {
      console.error('Verification error details:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      });
      toast.error(`Payment verification failed: ${error.message || 'An unexpected error occurred'}`);
      return { status: 'error', message: error.message || 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  return { initiatePayment, verifyPayment, isLoading };
};

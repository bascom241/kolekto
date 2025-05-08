import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentSuccessful from '@/components/contribute/PaymentSuccessful';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const PaymentSuccessPage = () => {
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      const searchParams = new URLSearchParams(location.search);
      const reference = searchParams.get('reference');

      if (!reference) {
        setError('No payment reference provided');
        setLoading(false);
        return;
      }

      try {
        // Verify the payment
        const verifyResponse = await axios.get(`http://localhost:9000/api/verify-payment/${reference}`);
        if (verifyResponse.data.success) {
          // Fetch payment details
          const paymentResponse = await axios.get(`http://localhost:9000/api/payments/${reference}`);
          setPaymentDetails(paymentResponse.data);
          toast.success('Payment verified successfully');
        } else {
          setError('Payment verification failed');
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'An error occurred while verifying the payment';
        setError(errorMessage);
        console.error('Payment verification error:', err);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying payment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-2">Payment Error</h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (!paymentDetails) {
    return null;
  }

  // Format participant details for PaymentSuccessful
  const participants = [
    {
      id: 'participant-1',
      details: [
        { label: 'Full Name', value: paymentDetails.fullName },
        { label: 'Email', value: paymentDetails.email },
        { label: 'Phone Number', value: paymentDetails.phoneNumber },
      ],
      uniqueCode: paymentDetails.paymentReference,
    },
  ];

  return (
    <PaymentSuccessful
      open={true}
      onOpenChange={(open) => !open && navigate('/')}
      collectionTitle="Contribution" // Replace with actual collection title if available
      amountPaid={paymentDetails.amount}
      participants={participants}
      transactionRef={paymentDetails.paymentReference}
    />
  );
};

export default PaymentSuccessPage;
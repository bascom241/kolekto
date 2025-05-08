import React, { useState } from 'react';
import ContributionForm from './ContributionForm';
import PaymentSuccessful from './PaymentSuccessful';
import PaymentErrorHandler from './PaymentErrorHandler';
import { toast } from 'sonner';

interface Field {
  name: string;
  type: string;
  required: boolean;
}

interface ContributionWrapperProps {
  collectionId: string;
  collectionTitle: string;
  amount: number;
  fields: Field[];
  description?: string;
  deadline?: string;
}

const ContributionWrapper: React.FC<ContributionWrapperProps> = ({ 
  collectionId, 
  collectionTitle, 
  amount, 
  fields,
  description,
  deadline
}) => {
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const [participantDetails, setParticipantDetails] = useState<any[]>([]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [transactionRef, setTransactionRef] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const isExpired = deadline ? new Date(deadline) < new Date() : false;
  
  const handlePaymentSuccess = (formData: any) => {
    console.log('Payment success with data:', formData);
    
    const formattedParticipants = formData.participants.map((participant: any, index: number) => {
      return {
        id: `participant-${index + 1}`,
        details: Object.entries(participant.data).map(([key, value]) => ({
          label: key,
          value: value as string
        })),
        uniqueCode: `${formData.collectionId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };
    });
    
    setParticipantDetails(formattedParticipants);
    setAmountPaid(formData.totalAmount);
    setTransactionRef(formData.transactionRef || '');
    setIsPaymentSuccessful(true);
    setError(null);
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
    setTimeout(() => {
      setError(null);
    }, 10000);
  };
  
  const handleRetry = () => {
    setError(null);
  };
  
  return (
    <>
      <PaymentErrorHandler error={error} onRetry={handleRetry} />
      
      {isExpired ? (
        <div className="text-center py-8">
          <h2 className="text-xl font-bold mb-2">Collection Expired</h2>
          <p className="text-gray-600">
            The deadline for this collection has passed and it is no longer accepting contributions.
          </p>
        </div>
      ) : (
        <ContributionForm
          collectionId={collectionId}
          collectionTitle={collectionTitle}
          amount={amount}
          fields={fields}
          description={description}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
      
      <PaymentSuccessful 
        open={isPaymentSuccessful}
        onOpenChange={setIsPaymentSuccessful}
        collectionTitle={collectionTitle}
        amountPaid={amountPaid}
        participants={participantDetails}
        transactionRef={transactionRef}
      />
    </>
  );
};

export default ContributionWrapper;
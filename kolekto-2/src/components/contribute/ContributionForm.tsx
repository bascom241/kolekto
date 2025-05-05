import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { usePaystack } from '@/hooks/usePaystack';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Field {
  name: string;
  type: string;
  required: boolean;
}

interface Participant {
  id: string;
  data: { [key: string]: string };
}

interface ContributionFormProps {
  collectionId: string;
  collectionTitle: string;
  amount: number;
  fields: Field[];
  description?: string;
  onPaymentSuccess: (formData: any) => void;
  onPaymentError: (errorMsg: string) => void;
}

const ContributionForm: React.FC<ContributionFormProps> = ({
  collectionId,
  collectionTitle,
  amount,
  fields,
  description,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [step, setState] = useState<'contact' | 'details' | 'payment'>('contact');
  const setStep = setState; // This alias keeps existing functionality

  const [numberOfParticipants, setNumberOfParticipants] = useState(1);
  const [participants, setParticipants] = useState<Participant[]>([{ id: '1', data: {} }]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { initiatePayment, verifyPayment, isLoading: paystackLoading } = usePaystack();

  useEffect(() => {
    const fetchPaystackKey = async () => {
      try {
        console.log('Attempting to fetch Paystack public key from Supabase...');
        const { data, error } = await supabase
          .from('payment_config')
          .select('key_value')
          .eq('key_name', 'paystack_public_key')
          .single();

        if (error) {
          console.error('Supabase fetch error:', error.message, error.details, error.hint);
          throw new Error(`Failed to fetch Paystack public key: ${error.message}`);
        }

        if (!data || !data.key_value) {
          console.error('No data returned or key_value is null:', data);
          throw new Error('Paystack public key not found in database.');
        }

        console.log('Successfully fetched Paystack public key:', data.key_value);
        setPublicKey(data.key_value);
      } catch (error: any) {
        console.error('Error fetching Paystack public key:', error.message);
        setFetchError('Failed to load payment configuration. Please try again later.');
        setPublicKey(null);
      }
    };

    fetchPaystackKey();
  }, []);

  const handleContactInfoChange = (field: string, value: string) => {
    setContactInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleParticipantsChange = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) return;
    setNumberOfParticipants(num);

    if (num > participants.length) {
      const newParticipants = [...participants];
      for (let i = participants.length + 1; i <= num; i++) {
        newParticipants.push({ id: i.toString(), data: {} });
      }
      setParticipants(newParticipants);
    } else if (num < participants.length) {
      setParticipants(participants.slice(0, num));
    }
  };

  const handleFieldChange = (participantId: string, fieldName: string, value: string) => {
    setParticipants(participants.map((participant) =>
      participant.id === participantId
        ? { ...participant, data: { ...participant.data, [fieldName]: value } }
        : participant
    ));
  };

  const isContactInfoComplete = () => {
    return (
      contactInfo.name.trim() !== '' &&
      contactInfo.email.trim() !== '' &&
      contactInfo.phone.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)
    );
  };

  const nextStep = () => {
    // Clear any previous payment errors when moving between steps
    setPaymentError(null);
    
    if (step === 'contact' && isContactInfoComplete()) {
      setStep('details');
    } else if (step === 'details') {
      const allFieldsFilled = participants.every((participant) =>
        fields.every(
          (field) =>
            !field.required || (participant.data[field.name] && participant.data[field.name].trim() !== '')
        )
      );
      if (allFieldsFilled) {
        setStep('payment');
      } else {
        toast.error('Please fill in all required fields for all participants.');
      }
    }
  };

  const previousStep = () => {
    // Clear any previous payment errors when moving between steps
    setPaymentError(null);
    
    if (step === 'details') {
      setStep('contact');
    } else if (step === 'payment') {
      setStep('details');
    }
  };

  if (fetchError) {
    return <div className="text-red-500 text-center p-4">{fetchError}</div>;
  }

  if (!publicKey) {
    return <div className="text-center p-4">Loading payment configuration...</div>;
  }

  const prepareParticipantData = () => {
    const preparedParticipants = [...participants];
    if (preparedParticipants.length > 0) {
      preparedParticipants[0] = {
        ...preparedParticipants[0],
        data: {
          ...preparedParticipants[0].data,
          'Full Name': contactInfo.name,
          'Email': contactInfo.email,
          'Phone': contactInfo.phone,
        },
      };
    }
    return preparedParticipants;
  };

  const handlePaystackPayment = async () => {
    try {
      setIsLoading(true);
      setPaymentError(null); // Clear previous errors

      const totalAmount = amount * numberOfParticipants;
      const preparedParticipants = prepareParticipantData();

      const metadata = {
        collectionId,
        collectionTitle,
        participants: preparedParticipants.map((p) => ({ data: p.data })),
        custom_fields: [],
      };

      console.log('Initiating payment with:', {
        email: contactInfo.email,
        amount: totalAmount,
        metadata,
      });

      const paymentData = await initiatePayment(contactInfo.email, totalAmount, metadata);

      console.log('Payment initiated:', paymentData);

      if (paymentData.authorization_url) {
        window.open(paymentData.authorization_url, '_blank');

        const checkInterval = setInterval(async () => {
          try {
            console.log('Checking payment status for reference:', paymentData.reference);
            const verificationData = await verifyPayment(paymentData.reference);

            if (verificationData && verificationData.status === 'success') {
              clearInterval(checkInterval);

              const successData = {
                collectionId,
                participants: preparedParticipants,
                paymentMethod: 'Paystack',
                totalAmount,
                contactInfo,
                transactionRef: paymentData.reference,
              };

              console.log('Payment success with data:', successData);

              await updateSupabaseAfterPayment(successData);

              onPaymentSuccess(successData);
              setIsLoading(false);
            }
          } catch (err) {
            console.error('Error verifying payment:', err);
          }
        }, 5000);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (isLoading) {
            setIsLoading(false);
            toast.info('Payment verification timed out. If you completed the payment, please check your email for confirmation.');
          }
        }, 300000);
      } else {
        throw new Error('Failed to get payment URL');
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      setIsLoading(false);
      
      // Set the error message for display in the UI
      setPaymentError(error.message || 'Payment failed. Please try again.');
      
      // Also show a toast notification
      toast.error(error.message || 'Payment failed. Please try again.');
      
      // Call the error handler from props
      onPaymentError(error.message || 'Payment failed. Please try again.');
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
    }
  };

  const updateSupabaseAfterPayment = async (paymentData: any) => {
    try {
      console.log('Updating Supabase with payment data:', paymentData);

      const { collectionId, participants, totalAmount, transactionRef, contactInfo } = paymentData;

      for (const participant of participants) {
        const uniqueCode = `${collectionId.slice(0, 6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const contributorData = {
          collection_id: collectionId,
          contributor_name: participant.data['Full Name'] || contactInfo.name,
          contributor_email: participant.data['Email'] || contactInfo.email,
          contributor_phone: participant.data['Phone'] || contactInfo.phone,
          contributor_id: 'anonymous',
          amount,
          status: 'paid',
          payment_method: 'paystack',
          payment_reference: transactionRef,
          receipt_details: {
            reference: transactionRef,
            collection_title: collectionTitle,
            unique_code: uniqueCode,
          },
          contact_info: Object.keys(participant.data || {}).reduce((acc: any, key: string) => {
            if (!['Full Name', 'Name', 'Email', 'Phone Number', 'Phone'].includes(key)) {
              acc[key] = participant.data[key];
            }
            return acc;
          }, {}),
        };

        console.log('Inserting contribution with data:', contributorData);

        const { data: contribution, error: contribError } = await supabase
          .from('contributions')
          .insert(contributorData)
          .select('id');

        if (contribError) {
          console.error('Error recording contribution:', contribError);
          continue;
        }

        console.log('Contribution inserted successfully:', contribution);

        if (contribution && contribution[0]?.id) {
          const platformChargePercent = calculatePlatformChargePercentage(amount);
          const platformCharge = amount * platformChargePercent;
          const gatewayFee = Math.min(amount * 0.015, 2000);

          const { data: trans, error: transError } = await supabase
            .from('transactions')
            .insert({
              collection_id: collectionId,
              contribution_id: contribution[0].id,
              type: 'contribution',
              status: 'successful',
              amount,
              description: `Payment for ${collectionTitle}`,
            });

          if (transError) {
            console.error('Error recording transaction:', transError);
          } else {
            console.log('Transaction recorded successfully:', trans);
          }
        }
      }

      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('total_amount')
        .eq('id', collectionId)
        .single();

      if (collectionError) {
        console.error('Error fetching collection:', collectionError);
      } else {
        const currentTotal = collection?.total_amount || 0;
        const newTotal = currentTotal + totalAmount;

        const { data: updateResult, error: updateError } = await supabase
          .from('collections')
          .update({
            total_amount: newTotal,
            updated_at: new Date().toISOString(),
          })
          .eq('id', collectionId);

        if (updateError) {
          console.error('Error updating collection total:', updateError);
        } else {
          console.log('Collection total updated successfully to:', newTotal);
        }
      }

      toast.success('Payment data successfully recorded.');
    } catch (err) {
      console.error('Error updating Supabase after payment:', err);
      toast.error('There was an issue recording your payment details.');
    }
  };

  const calculatePlatformChargePercentage = (amount: number): number => {
    if (amount < 1000) {
      return 0.03;
    } else if (amount < 5000) {
      return 0.025;
    } else if (amount < 20000) {
      return 0.02;
    } else {
      return 0.015;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      toast.error('Please select a payment method.');
      return;
    }
    setIsLoading(true);
    setPaymentError(null); // Clear previous errors
    handlePaystackPayment();
  };

  const renderContactForm = () => (
    <div className="space-y-4">
      <h3 className="font-medium">Contact Information</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={contactInfo.name}
            onChange={(e) => handleContactInfoChange('name', e.target.value)}
            required
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={contactInfo.email}
            onChange={(e) => handleContactInfoChange('email', e.target.value)}
            required
            placeholder="Enter your email address"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={contactInfo.phone}
            onChange={(e) => handleContactInfoChange('phone', e.target.value)}
            required
            placeholder="Enter your phone number"
          />
        </div>
      </div>
    </div>
  );

  const renderParticipantForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="numberOfParticipants">Number of Participants</Label>
        <Select value={numberOfParticipants.toString()} onValueChange={handleParticipantsChange}>
          <SelectTrigger id="numberOfParticipants" className="w-full">
            <SelectValue placeholder="Select number of participants" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? 'person' : 'people'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {participants.map((participant, index) => (
        <div key={participant.id} className="pt-4 pb-2 border-t">
          <h3 className="font-medium mb-4">
            {index === 0 ? 'Your Details' : `Participant ${index + 1} Details`}
          </h3>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={`${participant.id}-${field.name}`} className="space-y-2">
                <Label>
                  {field.name}
                  {field.required && ' *'}
                </Label>
                <Input
                  type={field.type}
                  value={participant.data[field.name] || ''}
                  onChange={(e) => handleFieldChange(participant.id, field.name, e.target.value)}
                  required={field.required}
                  placeholder={`Enter ${field.name.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderPaymentForm = () => (
    <div className="space-y-4">
      {paymentError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}
      
      <h3 className="font-medium mb-4">Choose Payment Method</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {['Paystack'].map((method) => (
          <div
            key={method}
            className={`border rounded-md p-4 cursor-pointer transition-colors ${
              paymentMethod === method ? 'border-kolekto bg-kolekto/5' : 'hover:border-gray-300'
            }`}
            onClick={() => setPaymentMethod(method)}
          >
            <div className="flex items-center">
              <div
                className={`w-4 h-4 rounded-full border ${
                  paymentMethod === method ? 'border-kolekto bg-kolekto' : 'border-gray-300'
                }`}
              >
                {paymentMethod === method && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="ml-2 font-medium">{method}</span>
            </div>
          </div>
        ))}
      </div>
      
      {retryCount > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          <p>If you're experiencing issues with payment:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Make sure you have sufficient funds in your account</li>
            <li>Check that your bank allows online transactions</li>
            <li>Try refreshing the page and attempting again</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>
      )}
    </div>
  );

  const getStepContent = () => {
    switch (step) {
      case 'contact':
        return renderContactForm();
      case 'details':
        return renderParticipantForm();
      case 'payment':
        return renderPaymentForm();
      default:
        return null;
    }
  };

  const getStepActions = () => {
    switch (step) {
      case 'contact':
        return (
          <Button
            type="button"
            onClick={nextStep}
            className="w-full bg-kolekto hover:bg-kolekto/90"
            disabled={!isContactInfoComplete()}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        );
      case 'details':
        return (
          <div className="flex gap-2 w-full">
            <Button type="button" onClick={previousStep} variant="outline" className="flex-1">
              Back
            </Button>
            <Button
              type="button"
              onClick={nextStep}
              className="flex-1 bg-kolekto hover:bg-kolekto/90"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      case 'payment':
        return (
          <div className="flex flex-col gap-2 w-full">
            <Button
              type="submit"
              className="w-full bg-kolekto hover:bg-kolekto/90"
              disabled={isLoading || !paymentMethod}
            >
              {isLoading
                ? 'Processing...'
                : `Pay ₦${(amount * numberOfParticipants).toLocaleString()}`}
            </Button>
            <Button
              type="button"
              onClick={previousStep}
              variant="outline"
              className="w-full"
            >
              Back
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{collectionTitle}</CardTitle>
          <CardDescription>
            {description && <div className="mt-2">{description}</div>}
            <div className="mt-2">Amount per person: ₦{amount.toLocaleString()}</div>
          </CardDescription>
        </CardHeader>
        <CardContent>{getStepContent()}</CardContent>
        <CardFooter className="border-t pt-4 flex flex-col space-y-3">
          <div className="w-full flex justify-between items-center">
            <span className="font-medium">Total Amount:</span>
            <span className="font-bold text-lg">
              ₦{(amount * numberOfParticipants).toLocaleString()}
            </span>
          </div>
          {getStepActions()}
        </CardFooter>
      </Card>
    </form>
  );
};

export default ContributionForm;

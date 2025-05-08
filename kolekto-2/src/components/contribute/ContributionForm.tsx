import React, { useState } from 'react';
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
import { usePaymentStore } from '@/store/usePayment'; // Adjust the import path
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
  const [step, setStep] = useState<'contact' | 'details' | 'payment'>('contact');
  const [numberOfParticipants, setNumberOfParticipants] = useState(1);
  const [participants, setParticipants] = useState<Participant[]>([{ id: '1', data: {} }]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { initializePayment, verifyPayment, paymentLoading } = usePaymentStore();

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
    setPaymentError(null);
    if (step === 'details') {
      setStep('contact');
    } else if (step === 'payment') {
      setStep('details');
    }
  };

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

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setPaymentError(null);

      const totalAmount = amount * numberOfParticipants;
      const preparedParticipants = prepareParticipantData();

      // Data to match backend's expected fields
      const paymentData = {
        fullName: contactInfo.name,
        email: contactInfo.email,
        phoneNumber: contactInfo.phone,
        amount: totalAmount,
      };

      console.log('Initiating payment with:', paymentData);

      const response = await initializePayment(paymentData);

      if (!response) {
        throw new Error('Failed to initialize payment');
      }

      const { authorization_url: authorizationUrl, reference } = response;

      console.log('Payment initiated:', { authorizationUrl, reference });

      if (authorizationUrl) {
        window.open(authorizationUrl, '_blank');

        const checkInterval = setInterval(async () => {
          try {
            console.log('Checking payment status for reference:', reference);
            const verificationData = await verifyPayment(reference);

            if (verificationData && verificationData.status === 'success') {
              clearInterval(checkInterval);

              const successData = {
                collectionId,
                participants: preparedParticipants,
                paymentMethod: 'Paystack', // Using Paystack as per backend
                totalAmount,
                contactInfo,
                transactionRef: reference,
              };

              console.log('Payment success with data:', successData);

              // Call Express endpoint to record payment
              const response = await fetch('/api/payments/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(successData),
              });

              if (!response.ok) {
                throw new Error('Failed to record payment');
              }

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
        }, 300000); // 5 minutes timeout
      } else {
        throw new Error('Failed to get payment URL');
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      setIsLoading(false);
      setPaymentError(error.message || 'Payment failed. Please try again.');
      toast.error(error.message || 'Payment failed. Please try again.');
      onPaymentError(error.message || 'Payment failed. Please try again.');
      setRetryCount(prev => prev + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      toast.error('Please select a payment method.');
      return;
    }
    setIsLoading(true);
    setPaymentError(null);
    handlePayment();
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
              disabled={isLoading || paymentLoading || !paymentMethod}
            >
              {isLoading || paymentLoading
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
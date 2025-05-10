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
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { usePaymentStore } from '@/store/usePayment';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { axiosInstance } from "@/lib/axios";

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
  const [paymentMethod, setPaymentMethod] = useState('Paystack');
  const [isLoading, setIsLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [verificationInterval, setVerificationInterval] = useState<NodeJS.Timeout | null>(null);

  const { initializePayment, verifyPayment, paymentLoading } = usePaymentStore();

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (verificationInterval) {
        clearInterval(verificationInterval);
      }
    };
  }, [verificationInterval]);

  const handleContactInfoChange = (field: string, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleParticipantsChange = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return;
    
    setNumberOfParticipants(Math.max(1, Math.min(10, num))); // Limit to 1-10 participants
    
    setParticipants(prev => {
      if (num > prev.length) {
        const newParticipants = [...prev];
        for (let i = prev.length; i < num; i++) {
          newParticipants.push({ id: (i + 1).toString(), data: {} });
        }
        return newParticipants;
      }
      return prev.slice(0, num);
    });
  };

  const handleFieldChange = (participantId: string, fieldName: string, value: string) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId ? { ...p, data: { ...p.data, [fieldName]: value } } : p
      )
    );
  };

  const validateContactInfo = () => {
    const errors = [];
    if (!contactInfo.name.trim()) errors.push('Full name is required');
    if (!contactInfo.email.trim()) errors.push('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) errors.push('Valid email is required');
    if (!contactInfo.phone.trim()) errors.push('Phone number is required');
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return false;
    }
    return true;
  };

  const validateParticipantData = () => {
    for (const participant of participants) {
      for (const field of fields) {
        if (field.required && !participant.data[field.name]?.trim()) {
          toast.error(`Please fill in ${field.name} for all participants`);
          return false;
        }
      }
    }
    return true;
  };

  const nextStep = () => {
    setPaymentError(null);
    if (step === 'contact' && validateContactInfo()) {
      setStep('details');
    } else if (step === 'details' && validateParticipantData()) {
      setStep('payment');
    }
  };

  const previousStep = () => {
    setPaymentError(null);
    setStep(step === 'payment' ? 'details' : 'contact');
  };

  const createContributor = async () => {
    try {
      const response = await axiosInstance.post(`/collections/${collectionId}/contributors`, {
        name: contactInfo.name,
        email: contactInfo.email,
        phoneNumber: contactInfo.phone,
        amount: amount * numberOfParticipants,
        collectionId
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create contributor');
      }

      return response.data.contributor?.id || response.data.contributor?._id;
    } catch (error: any) {
      console.error('Create contributor error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create contributor');
    }
  };

  const startPaymentVerification = async (reference: string) => {
    const interval = setInterval(async () => {
      try {
        const verification = await verifyPayment(reference);
        
        if (verification?.status === 'success') {
          clearInterval(interval);
          handlePaymentSuccess(reference);
        }
      } catch (error) {
        console.error('Verification error:', error);
      }
    }, 5000); // Check every 5 seconds

    setVerificationInterval(interval);

    // Timeout after 15 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (isLoading) {
        setIsLoading(false);
        toast.info('Payment verification timed out. Please check your email for confirmation.');
      }
    }, 900000);
  };

  const handlePaymentSuccess = (reference: string) => {
    const successData = {
      collectionId,
      collectionTitle,
      // participants: prepareParticipantData(),
      paymentMethod,
      totalAmount: amount * numberOfParticipants,
      contactInfo,
      transactionRef: reference,
      timestamp: new Date().toISOString()
    };

    setIsLoading(false);
    onPaymentSuccess(successData);
    toast.success('Payment successful!');
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsLoading(true);
    setPaymentError(null);

    try {
      // 1. Create contributor record
      const contributorId = await createContributor();
      
      // 2. Initialize payment
      const paymentData = {
        fullName: contactInfo.name,
        email: contactInfo.email,
        phoneNumber: contactInfo.phone,
        amount: amount * numberOfParticipants,
        contributorId,
        collectionId,
      };

      const paymentResponse = await initializePayment(paymentData);
      
      if (!paymentResponse?.authorization_url) {
        throw new Error('Failed to get payment URL');
      }

      // 3. Open payment gateway
      const paymentWindow = window.open(paymentResponse.authorization_url, '_blank');
      
      if (!paymentWindow) {
        throw new Error('Please allow popups to proceed with payment');
      }

      // 4. Start verification process
      startPaymentVerification(paymentResponse.reference);

    } catch (error: any) {
      console.error('Payment error:', error);
      setIsLoading(false);
      const errorMsg = error.message || 'Payment failed. Please try again.';
      setPaymentError(errorMsg);
      onPaymentError(errorMsg);
      toast.error(errorMsg);
    }
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
        <Select 
          value={numberOfParticipants.toString()} 
          onValueChange={handleParticipantsChange}
        >
          <SelectTrigger id="numberOfParticipants" className="w-full">
            <SelectValue placeholder="Select number of participants" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map(num => (
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
            {fields.map(field => (
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
      
      <h3 className="font-medium mb-4">Payment Method</h3>
      <div className="grid grid-cols-1 gap-3">
        <div
          className={`border rounded-md p-4 cursor-pointer transition-colors ${
            paymentMethod === 'Paystack' ? 'border-kolekto bg-kolekto/5' : 'hover:border-gray-300'
          }`}
          onClick={() => setPaymentMethod('Paystack')}
        >
          <div className="flex items-center">
            <div
              className={`w-4 h-4 rounded-full border ${
                paymentMethod === 'Paystack' ? 'border-kolekto bg-kolekto' : 'border-gray-300'
              }`}
            >
              {paymentMethod === 'Paystack' && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="ml-2 font-medium">Paystack (Cards, Bank Transfer, USSD)</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Secure payment processing powered by Paystack</p>
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (step) {
      case 'contact': return renderContactForm();
      case 'details': return renderParticipantForm();
      case 'payment': return renderPaymentForm();
      default: return null;
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
              type="button"
              onClick={handlePayment}
              className="w-full bg-kolekto hover:bg-kolekto/90"
              disabled={isLoading || paymentLoading}
            >
              {(isLoading || paymentLoading) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₦${(amount * numberOfParticipants).toLocaleString()}`
              )}
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
    <div className="space-y-6">
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
    </div>
  );
};

export default ContributionForm;
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
}

const PaymentErrorHandler: React.FC<PaymentErrorHandlerProps> = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="flex-grow">{error}</span>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="whitespace-nowrap"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default PaymentErrorHandler;
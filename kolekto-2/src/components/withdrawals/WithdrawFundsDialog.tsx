
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import WithdrawForm from './WithdrawForm';
import { toast } from 'sonner';

interface WithdrawFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: {
    amount: number;
    accountName: string;
    accountNumber: string;
    bankName: string;
  }) => void;
  collectionId?: string;
  collectionTitle?: string;
  availableBalance: number;
}

export const WithdrawFundsDialog: React.FC<WithdrawFundsDialogProps> = ({
  open,
  onOpenChange,
  onComplete,
  collectionId,
  collectionTitle,
  availableBalance,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleWithdraw = (data: {
    amount: number;
    accountName: string;
    accountNumber: string;
    bankName: string;
  }) => {
    setIsLoading(true);
    
    console.log('Withdrawal request:', {
      collectionId,
      collectionTitle,
      ...data
    });
    
    try {
      // Process the withdrawal via the parent component's handler
      onComplete(data);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to process withdrawal request. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            {collectionTitle 
              ? `Withdraw from "${collectionTitle}" collection.` 
              : 'Withdraw from your account balance.'}
          </DialogDescription>
        </DialogHeader>
        
        <WithdrawForm 
          availableBalance={availableBalance}
          onSubmit={handleWithdraw}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

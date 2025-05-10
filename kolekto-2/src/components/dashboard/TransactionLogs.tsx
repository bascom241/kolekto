
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PaymentStatusBadge from './PaymentStatusBadge';
import { calculatePlatformChargePercentage, calculateGatewayFee } from '@/utils/dbHelpers';

export interface Transaction {
  id: string;
  type: 'withdrawal' | 'contribution' | 'refund' | "payment";
  status: 'pending' | 'successful' | 'failed' | 'paid' | 'processing' | 'completed' | 'cancelled';
  amount: number;
  date: string;
  collection?: string;
  description?: string;
}

interface TransactionLogsProps {
  transactions: Transaction[];
}

// Removed duplicate Transaction interface declaration

const TransactionLogs: React.FC<TransactionLogsProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Transaction Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <p>No transaction history yet.</p>
            <p className="text-sm mt-2">Your transactions will appear here when you make withdrawals or receive contributions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Transaction Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const transactionDate = new Date(transaction.date);
            const formattedDate = transactionDate.toLocaleDateString('en-NG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            const formattedTime = transactionDate.toLocaleTimeString('en-NG', {
              hour: '2-digit',
              minute: '2-digit',
            });
            
            // Calculate fees if it's a contribution
            let platformCharge = 0;
            let gatewayFee = 0;
            let netAmount = transaction.amount;
            
            if (transaction.type === 'contribution' && transaction.status === 'successful') {
              const platformChargePercent = calculatePlatformChargePercentage(transaction.amount);
              platformCharge = transaction.amount * platformChargePercent;
              gatewayFee = calculateGatewayFee(transaction.amount);
              netAmount = transaction.amount - (platformCharge + gatewayFee);
            }
            
            return (
              <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0">
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <span className="font-medium capitalize">{transaction.type}</span>
                    <PaymentStatusBadge status={transaction.status} />
                  </div>
                  {transaction.collection && (
                    <div className="text-sm text-gray-600">{transaction.collection}</div>
                  )}
                  <div className="text-xs text-gray-500">{formattedDate} at {formattedTime}</div>
                </div>
                <div className="text-right mt-2 sm:mt-0">
                  <div className="font-medium">₦{transaction.amount.toLocaleString()}</div>
                  {transaction.type === 'contribution' && transaction.status === 'successful' && (
                    <div className="text-xs text-gray-500 mt-1">
                      <div>Platform Fee: ₦{platformCharge.toLocaleString()}</div>
                      <div>Gateway Fee: ₦{gatewayFee.toLocaleString()}</div>
                      <div className="font-medium text-green-600">Net: ₦{netAmount.toLocaleString()}</div>
                    </div>
                  )}
                  {transaction.description && (
                    <div className="text-xs text-gray-500 mt-1">{transaction.description}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionLogs;

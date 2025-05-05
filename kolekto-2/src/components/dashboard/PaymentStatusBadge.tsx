
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: 'pending' | 'successful' | 'failed' | 'paid' | 'processing' | 'completed' | 'cancelled';
  className?: string;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'successful':
    case 'paid':
    case 'completed':
      return (
        <Badge className={`bg-green-100 text-green-800 flex items-center ${className}`}>
          <CheckCircle className="h-3 w-3 mr-1" />
          {status === 'completed' ? 'Completed' : 'Successful'}
        </Badge>
      );
    case 'pending':
    case 'processing':
      return (
        <Badge className={`bg-yellow-100 text-yellow-800 flex items-center ${className}`}>
          <Clock className="h-3 w-3 mr-1" />
          {status === 'processing' ? 'Processing' : 'Pending'}
        </Badge>
      );
    case 'failed':
    case 'cancelled':
      return (
        <Badge className={`bg-red-100 text-red-800 flex items-center ${className}`}>
          <XCircle className="h-3 w-3 mr-1" />
          {status === 'cancelled' ? 'Cancelled' : 'Failed'}
        </Badge>
      );
    default:
      return (
        <Badge className={`bg-gray-100 text-gray-800 ${className}`}>
          {status}
        </Badge>
      );
  }
};

export default PaymentStatusBadge;

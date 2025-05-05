import React from 'react';
import { CheckIcon, Download, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PaymentDetail {
  label: string;
  value: string;
}

interface ParticipantInfo {
  id: string;
  details: PaymentDetail[];
  uniqueCode: string;
}

interface PaymentSuccessfulProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionTitle: string;
  amountPaid: number;
  participants: ParticipantInfo[];
  transactionRef?: string;
}

const PaymentSuccessful: React.FC<PaymentSuccessfulProps> = ({
  open,
  onOpenChange,
  collectionTitle,
  amountPaid,
  participants,
  transactionRef
}) => {
  const handleCopyToClipboard = () => {
    const text = `Payment for: ${collectionTitle}\nAmount: ₦${amountPaid.toLocaleString()}\nTransaction Ref: ${transactionRef || 'N/A'}\n\n` +
      participants.map(participant => {
        const details = participant.details.map(detail => `${detail.label}: ${detail.value}`).join('\n');
        return `${details}\nUnique Code: ${participant.uniqueCode}\n`;
      }).join('\n');
    
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Details copied to clipboard'))
      .catch(() => toast.error('Failed to copy details'));
  };
  
  const handleDownload = () => {
    const text = `Payment for: ${collectionTitle}\nAmount: ₦${amountPaid.toLocaleString()}\nTransaction Ref: ${transactionRef || 'N/A'}\n\n` +
      participants.map(participant => {
        const details = participant.details.map(detail => `${detail.label}: ${detail.value}`).join('\n');
        return `${details}\nUnique Code: ${participant.uniqueCode}\n`;
      }).join('\n');
    
    const element = document.createElement('a');
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${collectionTitle.replace(/\s+/g, '_')}_payment_details.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('Payment details downloaded');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckIcon className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">Payment Successful!</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium">{collectionTitle}</p>
            <p className="text-2xl font-bold">₦{amountPaid.toLocaleString()}</p>
            {transactionRef && (
              <p className="text-sm text-gray-500">Transaction Ref: {transactionRef}</p>
            )}
          </div>
          
          <div className="space-y-3">
            {participants.map((participant, index) => (
              <Card key={participant.id} className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex justify-between items-center">
                    <span>Participant {participants.length > 1 ? index + 1 : ''}</span>
                    <Badge className="font-mono">{participant.uniqueCode}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y divide-gray-100">
                    {participant.details.map((detail, i) => (
                      <div key={i} className="px-1 py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">{detail.label}</dt>
                        <dd className="text-sm sm:col-span-2">{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleCopyToClipboard}
              variant="outline"
              className="w-full sm:w-1/2"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Details
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full sm:w-1/2"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessful;
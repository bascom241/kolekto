
import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, QrCode, Download, Link } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  collectionId: string;
  collectionTitle: string;
  shareUrl?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  collectionId, 
  collectionTitle,
  shareUrl
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  
  // If no explicit shareUrl is provided, construct one
  const url = shareUrl || `${window.location.origin}/contribute/${collectionId}`;
  
  // QR code generation - using a simple placeholder for now
  // In a real app, we'd use a library like qrcode.react
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  
  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };
  
  const downloadQR = () => {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${collectionTitle.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded!');
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
          <div ref={qrRef} className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-lg shadow-sm mb-2">
              <img 
                src={qrCodeUrl}
                alt="Collection QR Code" 
                className="w-48 h-48"
              />
            </div>
            <p className="text-sm text-gray-500 text-center mt-2">
              Scan to contribute to <br /><span className="font-medium">{collectionTitle}</span>
            </p>
          </div>
          
          <div className="flex flex-col space-y-4 w-full lg:w-auto">
            <div className="space-y-2">
              <p className="text-sm font-medium">Share this collection</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={copyLink}
                  variant="outline"
                  className="flex-1 flex items-center justify-center"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button 
                  onClick={downloadQR}
                  variant="outline"
                  className="flex-1 flex items-center justify-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download QR
                </Button>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">Collection Link</p>
              <div className="flex items-center p-2 bg-gray-50 rounded-md border text-xs sm:text-sm overflow-hidden">
                <Link className="h-4 w-4 flex-shrink-0 mr-2 text-gray-500" />
                <span className="truncate flex-1">{url}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this link with participants to collect payments
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;

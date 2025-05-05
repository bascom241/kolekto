
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Eye, Share, Wallet } from 'lucide-react';

interface CollectionCardProps {
  id: string;
  title: string;
  description?: string;
  amount: number;
  deadline: string;
  status: 'active' | 'expired' | 'completed';
  participantsCount: number;
  maxParticipants?: number;
  dateCreated?: string;
  onShare: () => void;
  onViewDetails: () => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  id,
  title,
  description,
  amount,
  deadline,
  status,
  participantsCount,
  maxParticipants,
  dateCreated,
  onShare,
  onViewDetails
}) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800'
  };
  
  const deadlineDate = new Date(deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-NG', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  
  const createdDate = dateCreated ? new Date(dateCreated) : null;
  const formattedCreatedDate = createdDate 
    ? createdDate.toLocaleDateString('en-NG', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
    : 'N/A';
    
  // Calculate total amount raised (mocked for now)
  const totalRaised = participantsCount * amount;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge className={statusColors[status]}>
            {status === 'active' ? 'Active' : status === 'expired' ? 'Expired' : 'Completed'}
          </Badge>
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="py-2 flex-grow">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <p className="text-sm text-gray-600">Amount</p>
            <p className="font-medium">₦{amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Deadline</p>
            <p className="font-medium">{formattedDeadline}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Participants</p>
            <p className="font-medium">
              {participantsCount}
              {maxParticipants && ` / ${maxParticipants}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Raised</p>
            <p className="font-medium">₦{totalRaised.toLocaleString()}</p>
          </div>
          {dateCreated && (
            <div className="col-span-2 flex items-center gap-1 text-sm text-gray-500 mt-1">
              <CalendarDays size={12} />
              <span>Created: {formattedCreatedDate}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={onShare} className="flex items-center justify-center">
            <Share className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewDetails}
            className="flex items-center justify-center"
          >
            <Eye className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">View</span>
          </Button>
          <Button 
            size="sm" 
            className="bg-kolekto hover:bg-kolekto/90 flex items-center justify-center" 
          >
            <Wallet className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Withdraw</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CollectionCard;

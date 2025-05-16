import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import CollectionCard from '@/components/collections/CollectionCard';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCollectionStore } from '@/store/useCollectionStore';
import { Loader2 } from 'lucide-react';

const CollectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { collections, isLoading, error, fetchCollections } = useCollectionStore();
console.log(collections, 'collection');

  React.useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  React.useEffect(() => {
    if (error) {
      console.error('Error loading collections:', error);
      toast.error('Failed to load collections. Please try again.');
    }
  }, [error]);

  const handleShare = (id: string) => {
    console.log('Navigating to share collection with id:', id);
    if (id) {
      navigate(`/dashboard/collections/${id}?share=true`);
    } else {
      toast.error('Invalid collection ID');
    }
  };

  const handleViewDetails = (id: string) => {
    console.log('Navigating to view collection with id:', id);
    if (id) {
      navigate(`/dashboard/collections/${id}`);
    } else {
      toast.error('Invalid collection ID');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Collections</h1>
        <Button asChild className="bg-kolekto hover:bg-kolekto/90">
          <Link to="/dashboard/create-collection">New Collection</Link>
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
              <p className="text-gray-500">Loading collections...</p>
            </CardContent>
          </Card>
        ) : collections && collections.length > 0 ? (
          collections.map(collection => (
            <CollectionCard 
              key={collection.id}
              id={collection.id}
              title={collection.title}
              description={collection.description || undefined}
              amount={collection.amount}
              deadline={collection.deadline || new Date().toISOString()}
              status={collection.status as 'active' | 'expired' | 'completed'}
              participantsCount={collection.participants_count || 0}
              maxParticipants={collection.max_participants || undefined} 
              dateCreated={collection.created_at}
              onShare={() => handleShare(collection.id)}
              onViewDetails={() => handleViewDetails(collection.id)}
            />
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center">
              <p className="text-gray-500 mb-4">You don't have any collections yet</p>
              <Button asChild className="bg-kolekto hover:bg-kolekto/90">
                <Link to="/dashboard/create-collection">Create Your First Collection</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CollectionsPage;
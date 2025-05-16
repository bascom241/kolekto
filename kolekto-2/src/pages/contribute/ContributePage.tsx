import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ContributionWrapper from '@/components/contribute/ContributionWrapper';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollectionStore } from '@/store/useCollectionStore';
import { usePaymentStore } from '@/store/usePayment';
const ContributePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    selectedCollection: collection, 
    isLoading, 
    error, 
    fetchCollection 
  } = useCollectionStore();

  useEffect(() => {
    if (id) {
      fetchCollection(id);
    } else {
      toast.error('Collection ID is missing');
    }
  }, [id, fetchCollection]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching collection:', error);
      toast.error(error);
    }
  }, [error]);

  // Validate collection status and deadline
  useEffect(() => {
    if (collection && !isLoading) {
      if (collection.status !== 'active') {
        toast.error('This collection is no longer accepting contributions');
      } else if (collection.deadline && new Date(collection.deadline) < new Date()) {
        toast.error('The deadline for this collection has passed');
      }
    }
  }, [collection, isLoading]);

  
  // If still loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <p>Loading collection details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If there was an error or collection not found
  if (error || !collection || collection.status !== 'active' || (collection.deadline && new Date(collection.deadline) < new Date())) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-4">Collection Not Available</h2>
              <p className="mb-6 text-gray-600">{error || 'The requested collection could not be found'}</p>
              <Button onClick={() => navigate('/')}>Return to Home</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <ContributionWrapper 
            collectionId={collection.id}
            collectionTitle={collection.title}
            amount={collection.amount}
            fields={collection.participant_information}
            description={collection.description}
            deadline={collection.deadline}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContributePage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ContributionWrapper from '@/components/contribute/ContributionWrapper';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ContributePage: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCollection = async () => {
      if (!collectionId) {
        setError('Collection ID is missing');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .eq('id', collectionId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Collection not found');
        }
        
        // Check if collection is still active
        if (data.status !== 'active') {
          throw new Error('This collection is no longer accepting contributions');
        }
        
        // Check if deadline has passed
        if (data.deadline && new Date(data.deadline) < new Date()) {
          throw new Error('The deadline for this collection has passed');
        }
        
        setCollection(data);
      } catch (err: any) {
        console.error('Error fetching collection:', err);
        setError(err.message || 'Failed to fetch collection details');
        toast.error(err.message || 'Failed to fetch collection details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollection();
  }, [collectionId]);

  // Default fields for all collections
  const defaultFields = [
    { name: 'Full Name', type: 'text', required: true },
    { name: 'Email', type: 'email', required: true },
    { name: 'Phone Number', type: 'tel', required: false },
  ];
  
  // If still loading
  if (loading) {
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
  if (error || !collection) {
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
            fields={defaultFields}
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

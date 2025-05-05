
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateCollectionForm from '@/components/collections/CreateCollectionForm';

const CreateCollectionPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create a New Collection</h1>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Collection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCollectionForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCollectionPage;

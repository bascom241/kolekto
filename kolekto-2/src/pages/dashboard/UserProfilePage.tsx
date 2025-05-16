
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

interface UserProfile {
  full_name: string;
  email: string;
  phone_number: string | null;
}

const UserProfilePage: React.FC = () => {
  const { authUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
useEffect(()=>{
  if (authUser) {setLoading(false);}

},[authUser]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      {loading ? (
        <div className="text-center text-muted-foreground py-10">Loading profile...</div>
      ) : authUser ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Name</h3>
                <p className="text-gray-600">{authUser.fullName}</p>
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-gray-600">{authUser.email}</p>
              </div>
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-gray-600">{authUser.phoneNumber || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center text-destructive py-10">Profile not found.</div>
      )}
    </div>
  );
};

export default UserProfilePage;

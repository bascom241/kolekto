
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  full_name: string;
  email: string;
  phone_number: string | null;
}

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name,email,phone_number')
        .eq('id', user.id)
        .maybeSingle();
      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      {loading ? (
        <div className="text-center text-muted-foreground py-10">Loading profile...</div>
      ) : profile ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Name</h3>
                <p className="text-gray-600">{profile.full_name}</p>
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-gray-600">{profile.email}</p>
              </div>
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-gray-600">{profile.phone_number || 'Not provided'}</p>
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

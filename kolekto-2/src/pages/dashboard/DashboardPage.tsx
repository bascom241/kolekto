
import React, { useState, useEffect } from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import CollectionCard from '@/components/collections/CollectionCard';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { Loader2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { useCollectionsList, useDashboardStats, useRecentPayments } = useTransactions();
  
  const { 
    data: collections, 
    isLoading: isCollectionsLoading, 
    error: collectionsError 
  } = useCollectionsList(user?.id);
  
  const { 
    data: dashboardStats, 
    isLoading: isStatsLoading, 
    error: statsError 
  } = useDashboardStats(user?.id);
  
  const { 
    data: recentPayments, 
    isLoading: isPaymentsLoading, 
    error: paymentsError 
  } = useRecentPayments(user?.id);
  
  // Handle errors
  useEffect(() => {
    if (collectionsError) {
      console.error('Error loading collections:', collectionsError);
      toast.error('Failed to load your collections. Please try again.');
    }
    
    if (statsError) {
      console.error('Error loading dashboard stats:', statsError);
      toast.error('Failed to load dashboard statistics. Please try again.');
    }
    
    if (paymentsError) {
      console.error('Error loading recent payments:', paymentsError);
      toast.error('Failed to load recent payment data. Please try again.');
    }
  }, [collectionsError, statsError, paymentsError]);
  
  const handleShare = (id: string) => {
    navigate(`/dashboard/collections/${id}?share=true`);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/dashboard/collections/${id}`);
  };
  
  // Stats to display (use real data from Supabase)
  const stats = {
    totalCollections: dashboardStats?.totalCollections || 0,
    activeCollections: dashboardStats?.activeCollections || 0,
    totalParticipants: dashboardStats?.totalParticipants || 0,
    totalAmount: dashboardStats?.totalAmount || 0,
  };
  
  return (
    <div className="space-y-6">
      {isStatsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <DashboardStats {...stats} />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Active Collections</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/collections">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isCollectionsLoading ? (
              <div className="py-8 text-center flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                <span className="text-gray-500">Loading collections...</span>
              </div>
            ) : collections && collections.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {collections.slice(0, 3).map(collection => (
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
                    onShare={() => handleShare(collection.id)}
                    onViewDetails={() => handleViewDetails(collection.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p className="mb-4">You don't have any collections yet</p>
                <Button asChild className="bg-kolekto hover:bg-kolekto/90">
                  <Link to="/dashboard/create-collection">Create Your First Collection</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {isPaymentsLoading ? (
              <div className="py-8 text-center flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                <span className="text-gray-500">Loading recent payments...</span>
              </div>
            ) : recentPayments && recentPayments.length > 0 ? (
              <div className="space-y-4">
                {recentPayments.map(payment => {
                  const paymentDate = new Date(payment.date);
                  const formattedDate = paymentDate.toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                  });
                  const formattedTime = paymentDate.toLocaleTimeString('en-NG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  
                  return (
                    <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex-grow">
                        <div className="font-medium">{payment.name}</div>
                        <div className="text-sm text-gray-600">{payment.email}</div>
                        <div className="text-xs text-gray-500">{payment.collection}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₦{payment.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{formattedDate} at {formattedTime}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No recent payments found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

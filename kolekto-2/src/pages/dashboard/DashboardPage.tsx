import React, { useEffect } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import CollectionCard from "@/components/collections/CollectionCard";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useCollectionStore } from "@/store/useCollectionStore";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { collections, isLoading, error, fetchCollections } = useCollectionStore();

  // Fetch collections on mount
  useEffect(() => {
    if (user?.id) {
      fetchCollections();
    }
  }, [user?.id, fetchCollections]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Error loading collections:", error);
      toast.error("Failed to load your collections. Please try again.");
    }
  }, [error]);

  // Calculate dashboard stats
  const stats = {
    totalCollections: collections.length,
    activeCollections: collections.filter((c) => c.status === "active").length,
    totalParticipants: collections.reduce(
      (sum, c) => sum + (c.participants_count || 0),
      0
    ),
    totalAmount: collections.reduce((sum, c) => sum + (c.amount || 0), 0),
  };

  const handleShare = (id: string) => {
    navigate(`/dashboard/collections/${id}?share=true`);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/dashboard/collections/${id}`);
  };

  // Mock recent payments (fallback due to missing getAllContributors)
  const recentPayments = collections.slice(0, 3).map((collection, index) => ({
    id: `payment-${index}`,
    name: "Participant",
    email: "participant@example.com",
    collection: collection.title,
    amount: collection.amount / (collection.max_participants || 1),
    date: collection.created_at,
  }));

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <DashboardStats {...stats} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Active Collections ({stats.activeCollections})
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/collections">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                <span className="text-gray-500">Loading collections...</span>
              </div>
            ) : collections.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {collections.slice(0, 3).map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    id={collection.id}
                    title={collection.title}
                    description={collection.description}
                    amount={collection.amount}
                    deadline={collection.deadline}
                    status={collection.status}
                    participantsCount={collection.participants_count}
                    maxParticipants={collection.max_participants}
                    onShare={() => handleShare(collection.id)}
                    onViewDetails={() => handleViewDetails(collection.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p className="mb-4">You don't have any collections yet</p>
                <Button asChild className="bg-kolekto hover:bg-kolekto/90">
                  <Link to="/dashboard/create-collection">
                    Create Your First Collection
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                <span className="text-gray-500">Loading recent contributions...</span>
              </div>
            ) : recentPayments.length > 0 ? (
              <div className="space-y-4">
                {recentPayments.map((payment) => {
                  const paymentDate = new Date(payment.date);
                  const formattedDate = paymentDate.toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                  });
                  const formattedTime = paymentDate.toLocaleTimeString("en-NG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex-grow">
                        <div className="font-medium">{payment.name}</div>
                        <div className="text-sm text-gray-600">{payment.email}</div>
                        <div className="text-xs text-gray-500">{payment.collection}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₦{payment.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          {formattedDate} at {formattedTime}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No recent contributions found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
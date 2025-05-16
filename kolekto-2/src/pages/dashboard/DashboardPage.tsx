import React, { useEffect } from "react";
import { useCollectionStore } from "@/store/useCollectionStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { collections, isLoading, error, fetchCollections } = useCollectionStore();

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const stats = {
    totalCollections: collections.length,
    activeCollections: collections.filter(c => c.status === "active").length,
    totalParticipants: collections.reduce((sum, c) => sum + (c.participants_count || 0), 0),
    totalAmount: collections.reduce((sum, c) => sum + c.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCollections}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCollections}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Collections</CardTitle>
          <Button asChild>
            <Link to="/dashboard/create-collection">
              <Plus className="mr-2 h-4 w-4" /> New Collection
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : collections.length > 0 ? (
            <div className="space-y-4">
              {collections.map((collection) => (
                <div 
                  key={collection.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/dashboard/collections/${collection.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{collection.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {collection.participants_count} participants • ₦{collection.amount.toLocaleString()} each
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      collection.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : collection.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {collection.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p className="mb-4">You don't have any collections yet</p>
              <Button asChild>
                <Link to="/dashboard/create-collection">
                  <Plus className="mr-2 h-4 w-4" /> Create your first collection
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
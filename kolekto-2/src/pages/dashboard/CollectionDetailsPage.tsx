import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCollectionStore } from "@/store/useCollectionStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, BarChart, Eye, Download, Share, Wallet } from "lucide-react";
import { toast } from "sonner";

const CollectionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    selectedCollection: collection,
    contributors,
    isLoading,
    isContributorsLoading,
    error,
    contributorsError,
    fetchCollection,
    fetchContributors,
  } = useCollectionStore();

  useEffect(() => {
    if (id) {
      fetchCollection(id);
      fetchContributors(id);
    }
  }, [id, fetchCollection, fetchContributors]);

  useEffect(() => {
    if (error) toast.error(error);
    if (contributorsError) toast.error(contributorsError);
  }, [error, contributorsError]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">Collection not found</h2>
        <Button onClick={() => navigate("/dashboard")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const filteredContributors = contributors.filter(contributor =>
    contributor.contributor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contributor.contributor_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCollected = contributors
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{collection.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/contribute/${id}`)}>
            <Share className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button disabled={totalCollected <= 0}>
            <Wallet className="mr-2 h-4 w-4" /> Withdraw
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Target Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{collection.amount.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Per participant</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalCollected.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              {contributors.filter(c => c.status === "paid").length} contributors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collection.deadline ? new Date(collection.deadline).toLocaleDateString() : "None"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-4">
            <Button
              variant={activeTab === "overview" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("overview")}
            >
              <Eye className="mr-2 h-4 w-4" /> Overview
            </Button>
            <Button
              variant={activeTab === "contributors" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("contributors")}
            >
              <Users className="mr-2 h-4 w-4" /> Contributors
            </Button>
            <Button
              variant={activeTab === "activity" ? "secondary" : "ghost"}
              onClick={() => setActiveTab("activity")}
            >
              <BarChart className="mr-2 h-4 w-4" /> Activity
            </Button>
          </div>
        </div>

        {activeTab === "contributors" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Contributors</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search contributors..."
                  className="pl-8 pr-4 py-2 border rounded-lg w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isContributorsLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredContributors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContributors.map((contributor) => (
                    <TableRow key={contributor.id}>
                      <TableCell>{contributor.contributor_name}</TableCell>
                      <TableCell>{contributor.contributor_email}</TableCell>
                      <TableCell>₦{contributor.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          contributor.status === "paid" 
                            ? "bg-green-100 text-green-800" 
                            : contributor.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {contributor.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No contributors found
              </div>
            )}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Collection Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">
                  {collection.description || "No description provided"}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Participants</h4>
                <p className="text-muted-foreground">
                  {contributors.length} of {collection.max_participants || "∞"} participants
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetailsPage;
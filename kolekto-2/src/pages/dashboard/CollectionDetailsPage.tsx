import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRCodeDisplay from '@/components/collections/QRCodeDisplay';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart, Calendar, Download, Eye, Share, Wallet,
  Users, Clock, AlertCircle, CheckCircle, TimerOff, Loader2
} from 'lucide-react';
import { WithdrawFundsDialog } from '@/components/withdrawals/WithdrawFundsDialog';
import { toast } from 'sonner';
import { ChartContainer } from "@/components/ui/chart";
import {
  Bar,
  XAxis, 
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart as RechartsBarChart
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useCollectionStore } from '@/store/useCollectionStore';

// Static mock contributor data
const mockContributors = [
  {
    id: '1',
    contributor_name: 'John Doe',
    contributor_email: 'john@example.com',
    contributor_phone: '1234567890',
    created_at: '2025-05-01',
    amount: 10000,
    status: 'paid'
  },
  {
    id: '2',
    contributor_name: 'Jane Smith',
    contributor_email: 'jane@example.com',
    contributor_phone: '0987654321',
    created_at: '2025-05-02',
    amount: 15000,
    status: 'paid'
  }
];

const CollectionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showQR, setShowQR] = useState(false);
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  
  const { 
    selectedCollection: collection, 
    isLoading: collectionLoading, 
    error: collectionError,
    fetchCollection
  } = useCollectionStore();

  useEffect(() => {
    if (id) {
      fetchCollection(id);
    }
  }, [id, fetchCollection]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('share') === 'true') {
      setIsShareDrawerOpen(true);
    }
  }, [location]);

  useEffect(() => {
    if (collectionError) {
      console.error('Error fetching collection details:', collectionError);
      toast.error('Failed to load collection details');
    }
  }, [collectionError]);

  const shareUrl = `${window.location.origin}/contribute/${id}`;

  const handleShare = () => {
    setIsShareDrawerOpen(true);
  };

  const exportToCSV = () => {
    if (!mockContributors || mockContributors.length === 0) {
      toast.info("No contributors data to export");
      return;
    }
    
    const headers = [
      'Name', 
      'Email', 
      'Phone', 
      'Date Contributed',
      'Status'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    mockContributors.forEach(contributor => {
      const formattedDate = new Date(contributor.created_at).toLocaleDateString('en-NG');
      const row = [
        contributor.contributor_name,
        contributor.contributor_email,
        contributor.contributor_phone || 'N/A',
        formattedDate,
        contributor.status
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${collection?.title || 'collection'}-contributors.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Contributor data exported successfully!');
  };

  const handleWithdraw = () => {
    setIsWithdrawDialogOpen(true);
  };

  const onWithdrawComplete = (data: {
    amount: number;
    accountName: string;
    accountNumber: string;
    bankName: string;
  }) => {
    if (!user?.id || !collection) {
      toast.error('Unable to process withdrawal. Please try again.');
      return;
    }

    // Mock withdrawal logic
    console.log('Mock withdrawal:', {
      organizer_id: user.id,
      collection_id: collection.id,
      amount: data.amount,
      account_name: data.accountName,
      account_number: data.accountNumber,
      bank_name: data.bankName
    });
    
    setIsWithdrawDialogOpen(false);
    toast.success('Withdrawal request simulated. In a real app, this would be processed.');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'expired':
        return <TimerOff className="h-4 w-4 mr-1" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'closed':
        return <AlertCircle className="h-4 w-4 mr-1" />;
      default:
        return <Clock className="h-4 w-4 mr-1" />;
    }
  };

  const filteredContributors = mockContributors.filter(contributor => 
    contributor.contributor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contributor.contributor_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const contributionsByDate = mockContributors.reduce((acc: Record<string, number>, curr) => {
    const date = new Date(curr.created_at).toLocaleDateString('en-NG');
    acc[date] = (acc[date] || 0) + (curr.amount || 0);
    return acc;
  }, {});

  const chartData = Object.keys(contributionsByDate).map(date => ({
    date,
    amount: contributionsByDate[date] || 0
  }));

  const totalCollected = mockContributors.reduce((sum, contributor) => {
    return contributor.status === 'paid' ? sum + (contributor.amount || 0) : sum;
  }, 0);
  
  const contributorsCount = mockContributors.filter(c => c.status === 'paid').length;
  const withdrawableAmount = totalCollected * 0.9;

  if (collectionLoading) {
    return (
      <div className="py-10 text-center text-gray-500">
        <div className="flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Loading collection details...
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Collection Not Found</h2>
        <p className="text-gray-600 mb-6">The collection you're looking for doesn't exist or you may not have permission to view it.</p>
        <Button onClick={() => navigate('/dashboard/collections')} className="bg-kolekto hover:bg-kolekto/90">
          Go to Collections
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{collection.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs flex items-center ${getStatusColor(collection.status)}`}>
              {getStatusIcon(collection.status)}
              {collection.status}
            </span>
          </div>
          {collection.description && (
            <p className="text-gray-600 mt-1">{collection.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleShare}
            className="bg-kolekto hover:bg-kolekto/90 flex items-center"
          >
            <Share className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Share Collection</span>
            <span className="sm:hidden">Share</span>
          </Button>
          
          <Button 
            onClick={handleWithdraw} 
            variant="outline"
            className="border-kolekto text-kolekto hover:bg-kolekto/10 flex items-center"
            disabled={withdrawableAmount <= 0}
          >
            <Wallet className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Withdraw Funds</span>
            <span className="sm:hidden">Withdraw</span>
          </Button>
        </div>
      </div>
      
      {showQR && (
        <div className="mb-6">
          <QRCodeDisplay 
            collectionId={id || ''} 
            collectionTitle={collection.title || 'Collection'} 
            shareUrl={shareUrl}
          />
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Eye className="h-4 w-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="contributors" className="flex items-center gap-1">
            <Users className="h-4 w-4 mr-1" />
            Contributors
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1">
            <BarChart className="h-4 w-4 mr-1" />
            Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Collection Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{collection.amount.toLocaleString()}</div>
                <p className="text-sm text-gray-500">Per participant</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{totalCollected.toLocaleString()}</div>
                <p className="text-sm text-gray-500">From {contributorsCount} contributors</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Deadline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {collection.deadline ? 
                    new Date(collection.deadline).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'No deadline set'}
                </div>
                <p className="text-sm text-gray-500">
                  {collection.deadline && new Date(collection.deadline) > new Date() 
                    ? `${Math.ceil((new Date(collection.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left` 
                    : collection.deadline ? 'Expired' : 'No deadline'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Collection Information</CardTitle>
                <CardDescription>Details about this collection and how to participate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Collection Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Created On</span>
                        <span className="font-medium">
                          {new Date(collection.created_at).toLocaleDateString('en-NG')}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs flex items-center ${getStatusColor(collection.status)}`}>
                          {getStatusIcon(collection.status)}
                          {collection.status}
                        </span>
                      </div>
                      {collection.max_participants && (
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Max Participants</span>
                          <span className="font-medium">{collection.max_participants}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Current Contributors</span>
                        <span className="font-medium">{contributorsCount}</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-gray-600">Unique Payment Link</span>
                        <a 
                          href={shareUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-kolekto hover:underline truncate max-w-[200px]"
                        >
                          {shareUrl.split('/').pop()}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button 
                        onClick={handleShare} 
                        variant="outline" 
                        className="w-full flex items-center justify-center"
                      >
                        <Share className="mr-2 h-4 w-4" />
                        Share Collection
                      </Button>
                      <Button 
                        onClick={() => setShowQR(!showQR)} 
                        variant="outline" 
                        className="w-full flex items-center justify-center"
                      >
                        {showQR ? 'Hide QR Code' : 'Show QR Code'}
                      </Button>
                      <Button 
                        onClick={exportToCSV} 
                        variant="outline" 
                        className="w-full flex items-center justify-center"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Contributors Data
                      </Button>
                      <Button 
                        onClick={handleWithdraw} 
                        className="w-full bg-kolekto hover:bg-kolekto/90 flex items-center justify-center"
                        disabled={withdrawableAmount <= 0}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Withdraw Funds
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="contributors" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Contributors & Input Data</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search contributors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 border rounded w-full sm:w-auto"
                />
                <Button 
                  onClick={exportToCSV}
                  variant="outline" 
                  size="sm"
                  className="flex items-center whitespace-nowrap"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-auto">
              {filteredContributors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead className="hidden lg:table-cell">Phone</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContributors.map(contributor => (
                      <TableRow key={contributor.id}>
                        <TableCell className="font-medium">{contributor.contributor_name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{contributor.contributor_email}</TableCell>
                        <TableCell className="hidden md:table-cell">₦{contributor.amount?.toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(contributor.created_at).toLocaleDateString('en-NG')}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{contributor.contributor_phone || 'N/A'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            contributor.status === 'paid' ? 'bg-green-100 text-green-800' : 
                            contributor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {contributor.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  {searchTerm ? 'No contributors match your search' : 'No contributors yet'}
                </div>
              )}
              <div className="block sm:hidden mt-4">
                <p className="text-xs text-gray-500">Swipe to see full contributor details</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contribution Activity</CardTitle>
              <div className="text-right">
                <div className="text-sm text-gray-500">Available for withdrawal</div>
                <div className="font-bold text-lg">₦{withdrawableAmount.toLocaleString()}</div>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-64 w-full mb-6">
                  <ChartContainer
                    config={{
                      amount: {
                        color: "#10B981",
                      },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={chartData}>
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={(value) => `₦${value}`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip 
                          formatter={(value) => `₦${Number(value).toLocaleString()}`} 
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar 
                          dataKey="amount" 
                          name="Amount" 
                          fill="var(--color-amount)" 
                          radius={[4, 4, 0, 0]}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-64 w-full bg-gray-100 rounded-md flex items-center justify-center mb-6">
                  <p className="text-gray-500">No payment activity yet</p>
                </div>
              )}
              
              <h3 className="font-medium mb-4">Recent Contributions</h3>
              {filteredContributors.length > 0 ? (
                <div className="space-y-4">
                  {filteredContributors.slice(0, 5).map((contributor) => (
                    <div key={contributor.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <div className="font-medium">{contributor.contributor_name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(contributor.created_at).toLocaleDateString('en-NG')}
                        </div>
                      </div>
                      <div className="font-bold">₦{contributor.amount?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  No contributions yet
                </div>
              )}
              
              <div className="mt-6">
                <Button 
                  onClick={handleWithdraw}
                  className="w-full bg-kolekto hover:bg-kolekto/90"
                  disabled={withdrawableAmount <= 0}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Withdraw Funds
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Drawer open={isShareDrawerOpen} onOpenChange={setIsShareDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Share Collection</DrawerTitle>
            <DrawerDescription>
              Share this collection with participants to collect contributions
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <QRCodeDisplay 
              collectionId={id || ''} 
              collectionTitle={collection.title || 'Collection'} 
              shareUrl={shareUrl}
            />
          </div>
          <DrawerFooter>
            <Button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Contribute to ${collection.title}`,
                    text: `Join me in contributing to ${collection.title}`,
                    url: shareUrl,
                  }).catch(err => {
                    console.error('Error sharing:', err);
                  });
                } else {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link copied to clipboard!');
                }
              }}
              className="w-full bg-kolekto hover:bg-kolekto/90"
            >
              <Share className="mr-2 h-4 w-4" />
              {navigator.share ? 'Share via apps' : 'Copy link'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      <WithdrawFundsDialog 
        open={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        onComplete={onWithdrawComplete}
        availableBalance={withdrawableAmount}
        collectionId={id}
        collectionTitle={collection.title}
      />
    </div>
  );
};

export default CollectionDetailsPage;
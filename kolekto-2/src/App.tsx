import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import CreateCollectionPage from "./pages/dashboard/CreateCollectionPage";
import CollectionsPage from "./pages/dashboard/CollectionsPage";
import ProfilePage from "./pages/dashboard/ProfilePage";
import TransactionHistoryPage from "./pages/dashboard/SettingsPage";
import ContributePage from "./pages/contribute/ContributePage";
import NotFound from "./pages/NotFound";
import CollectionDetailsPage from "./pages/dashboard/CollectionDetailsPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import UserProfilePage from "./pages/dashboard/UserProfilePage";

// Create query client outside of the component to avoid React hooks issues
const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Auth layout that wraps all routes
const AuthenticatedApp = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/contribute/:collectionId" element={<ContributePage />} />
    
    {/* Protected Dashboard Routes */}
    <Route path="/dashboard" element={

        <DashboardLayout />
      
    }>
      <Route index element={<DashboardPage />} />
      <Route path="collections" element={<CollectionsPage />} />
      <Route path="collections/:id" element={<CollectionDetailsPage />} />
      <Route path="create-collection" element={<CreateCollectionPage />} />
      <Route path="profile" element={<UserProfilePage />} />
      <Route path="transactions" element={<TransactionHistoryPage />} />
    </Route>
    
    {/* Catch-all for 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Main App component restructured to fix React hooks issues
const App = () => {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthenticatedApp />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

export default App;
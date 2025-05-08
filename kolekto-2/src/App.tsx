import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import { AuthProvider } from "./context/AuthContext";
import UserProfilePage from "./pages/dashboard/UserProfilePage";
import VerifyEmail from "./pages/auth/VerifyEmail";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PaymentSuccessPage from "./success/PaymentSuccessPage";

// Create query client outside of the component
const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public route component to redirect authenticated users to dashboard for specific routes
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { authUser, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  if (isCheckingAuth) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Redirect authenticated users to /dashboard only for specific public routes
  const redirectRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  if (authUser && redirectRoutes.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Authenticated app routes
const AuthenticatedApp = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
    <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
    <Route path="/contribute/:id" element={<PublicRoute><ContributePage /></PublicRoute>} />
    <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
    <Route path="/success" element={<PublicRoute><PaymentSuccessPage /></PublicRoute>} /> {/* Add this line */}
    {/* Protected Dashboard Routes */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
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

// Main App component
const App = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
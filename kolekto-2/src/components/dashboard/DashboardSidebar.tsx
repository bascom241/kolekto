
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../Logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { 
  User, 
  CreditCard, 
  LogOut, 
  PlusCircle, 
  BarChart3, 
  History 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { setOpen } = useSidebar();
  const isMobile = useIsMobile();
  
  const isActive = (path: string) => {
    return location.pathname === path || 
      (path !== '/dashboard' && location.pathname.startsWith(path));
  };
  
  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };
  
  return (
    <Sidebar>
      <SidebarHeader className="py-4 px-3">
        <Logo size="md" />
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <div className="space-y-2">
          <Button
            variant={isActive('/dashboard') ? 'default' : 'ghost'}
            className={`w-full justify-start transition-all duration-200 ${
              isActive('/dashboard') 
                ? 'bg-kolekto text-white font-semibold border-l-4 border-kolekto-dark scale-105' 
                : 'hover:bg-kolekto/10 hover:text-kolekto'
            }`}
            size="sm"
            onClick={() => handleNavigation('/dashboard')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          
          <Button
            variant={isActive('/dashboard/collections') ? 'default' : 'ghost'}
            className={`w-full justify-start transition-all duration-200 ${
              isActive('/dashboard/collections') 
                ? 'bg-kolekto text-white font-semibold border-l-4 border-kolekto-dark scale-105' 
                : 'hover:bg-kolekto/10 hover:text-kolekto'
            }`}
            size="sm"
            onClick={() => handleNavigation('/dashboard/collections')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Collections
          </Button>
          
          <Button
            variant={isActive('/dashboard/create-collection') ? 'default' : 'ghost'}
            className={`w-full justify-start transition-all duration-200 ${
              isActive('/dashboard/create-collection') 
                ? 'bg-kolekto text-white font-semibold border-l-4 border-kolekto-dark scale-105' 
                : 'hover:bg-kolekto/10 hover:text-kolekto'
            }`}
            size="sm"
            onClick={() => handleNavigation('/dashboard/create-collection')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Collection
          </Button>
          
          <Button
            variant={isActive('/dashboard/profile') ? 'default' : 'ghost'}
            className={`w-full justify-start transition-all duration-200 ${
              isActive('/dashboard/profile') 
                ? 'bg-kolekto text-white font-semibold border-l-4 border-kolekto-dark scale-105' 
                : 'hover:bg-kolekto/10 hover:text-kolekto'
            }`}
            size="sm"
            onClick={() => handleNavigation('/dashboard/profile')}
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          
          <Button
            variant={isActive('/dashboard/transactions') ? 'default' : 'ghost'}
            className={`w-full justify-start transition-all duration-200 ${
              isActive('/dashboard/transactions') 
                ? 'bg-kolekto text-white font-semibold border-l-4 border-kolekto-dark scale-105' 
                : 'hover:bg-kolekto/10 hover:text-kolekto'
            }`}
            size="sm"
            onClick={() => handleNavigation('/dashboard/transactions')}
          >
            <History className="mr-2 h-4 w-4" />
            Transaction History
          </Button>
        </div>
      </SidebarContent>
      
      <SidebarFooter className="px-3 py-6">
        <Button 
          variant="ghost" 
          className="w-full justify-start hover:bg-kolekto/10 hover:text-kolekto"
          size="sm"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;

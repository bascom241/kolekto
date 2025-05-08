import { create } from 'zustand';
import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';
import { NavigateFunction } from 'react-router-dom';

// Define the User type based on the backend User model
interface User {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  // Add other fields if returned by the backend, e.g., createdAt, updatedAt
}

// Define input types for form data
interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

interface VerifyEmailData {
  code: string;
}

interface AuthState {
  login: (formData: LoginFormData, navigate: NavigateFunction) => Promise<void>;
  register: (formData: RegisterFormData, navigate: NavigateFunction) => Promise<void>;
  verifyEmail: (data: VerifyEmailData, navigate: NavigateFunction) => Promise<void>;
  checkAuth: () => Promise<void>;
  isLoggedIn: boolean;
  isRegister: boolean;
  isVerified: boolean;
  isCheckingAuth: boolean;
  authUser: User | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  isRegister: false,
  isLoggedIn: false,
  isVerified: false,
  authUser: null,
  isCheckingAuth: false,
  login: async (formData, navigate) => {
    set({ isLoggedIn: true });
    try {
      const response = await axiosInstance.post('/users/login', formData);
      set({ isLoggedIn: false, authUser: response.data.user });
      toast.success(response.data.message);
      navigate('/dashboard');
    } catch (error) {
      set({ isLoggedIn: false });
      if (error instanceof Error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  },
  register: async (formData, navigate) => {
    set({ isRegister: true });
    try {
      const response = await axiosInstance.post('/users/register', formData);
      set({ isRegister: false, authUser: response.data.user });
      toast.success(response.data.message);
      navigate('/verify-email');
    } catch (error) {
      set({ isRegister: false });
      if (error instanceof Error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  },
  verifyEmail: async (data, navigate) => {
    set({ isVerified: true });
    try {
      const response = await axiosInstance.post('/users/verify-email', data);
      set({ isVerified: false });
      toast.success(response.data.message);
      navigate('/dashboard');
    } catch (error) {
      set({ isVerified: false });
      console.log(error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  },
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await axiosInstance.get('/users/check-auth');
      set({ authUser: response.data.user, isCheckingAuth: false });
      toast.success('User Authenticated');
    } catch (error) {
      set({ isCheckingAuth: false, authUser: null });
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }
}));
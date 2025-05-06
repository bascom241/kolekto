import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(formData, navigate);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast.error('Could not sign in');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          required
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link to="/forgot-password" className="text-sm text-kolekto hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-kolekto hover:bg-kolekto/90"
      >
        Sign In
      </Button>
      
      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link to="/register" className="text-kolekto hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
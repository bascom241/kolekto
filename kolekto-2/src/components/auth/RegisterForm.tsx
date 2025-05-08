import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Registration failed');
      return;
    }

    if (formData.phoneNumber && formData.phoneNumber.replace(/\D/g, '').length < 10) {
      setError('Phone number must be at least 10 digits');
      toast.error('Registration failed');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData, navigate);
    
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast.error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      {error && (
        <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Doe"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number (WhatsApp preferred)</Label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="+234 123 456 7890"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-kolekto hover:bg-kolekto/90" 
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>
      
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-kolekto hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
};

export default RegisterForm;
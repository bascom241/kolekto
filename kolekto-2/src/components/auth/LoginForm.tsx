
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, LogIn } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn, sendMagicLink } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
        toast.error('Login failed');
      } else {
        toast.success('Login successful!');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.trim()) {
      setError('Please enter your email address first');
      return;
    }
    
    setIsMagicLinkLoading(true);
    
    try {
      const { error } = await sendMagicLink(email);
      if (error) {
        setError(error.message);
        toast.error('Could not send magic link');
      } else {
        setIsMagicLinkSent(true);
        toast.success('Magic link sent! Check your email.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast.error('Could not send magic link');
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  if (isMagicLinkSent) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 text-green-700 p-4 rounded-md">
          <h3 className="font-medium">Check your email</h3>
          <p className="text-sm mt-1">
            We've sent a magic link to <strong>{email}</strong>
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Click the link in your email to sign in to your account.
        </p>
        <div className="mt-4">
          <button 
            onClick={() => setIsMagicLinkSent(false)}
            className="text-kolekto hover:underline"
          >
            Try another method
          </button>
        </div>
      </div>
    );
  }

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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-kolekto hover:bg-kolekto/90" 
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In with Password"}
      </Button>
      
      <div className="relative mt-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>
      
      <Button 
        type="button"
        variant="outline" 
        className="w-full" 
        onClick={handleMagicLink}
        disabled={isMagicLinkLoading}
      >
        <Mail className="mr-2 h-4 w-4" />
        {isMagicLinkLoading ? "Sending..." : "Sign In with Magic Link"}
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


import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from 'sonner';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        setError(error.message);
        toast.error('Failed to send reset link');
      } else {
        setIsSubmitted(true);
        toast.success('Password reset link sent');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast.error('Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 text-green-700 p-4 rounded-md">
          <h3 className="font-medium">Check your email</h3>
          <p className="text-sm mt-1">
            We've sent a password reset link to {email}
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Didn't receive the email? Check your spam folder or{" "}
          <button 
            onClick={() => setIsSubmitted(false)}
            className="text-kolekto hover:underline"
          >
            try again
          </button>
        </p>
        <div className="mt-4">
          <Link to="/login" className="text-sm text-kolekto hover:underline">
            Back to login
          </Link>
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
      <Button 
        type="submit" 
        className="w-full bg-kolekto hover:bg-kolekto/90" 
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send Reset Link"}
      </Button>
      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link to="/login" className="text-kolekto hover:underline">
          Back to login
        </Link>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;

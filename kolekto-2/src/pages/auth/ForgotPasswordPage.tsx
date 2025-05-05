
import React from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Logo from '@/components/Logo';

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Logo className="mx-auto" />
            <h1 className="text-2xl font-bold mt-4">Reset Your Password</h1>
            <p className="text-gray-600 mt-2">
              Enter your email to receive a password reset link
            </p>
          </div>
          
          <div className="bg-white shadow-md rounded-xl p-6 border">
            <ForgotPasswordForm />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;


import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import FaqSection from '@/components/home/FaqSection';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const HomePage: React.FC = () => {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 px-4 md:py-24 kolekto-gradient text-white">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Collect Group Payments with Ease
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Kolekto is a smart, modern platform that allows organizers to collect group payments
              while capturing participant details in a single flow.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-kolekto-yellow text-kolekto hover:bg-kolekto-yellow/90"
                asChild
              >
                <Link to="/register">Get Started</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-kolekto-yellow hover:bg-white/20 hover:border-white group relative overflow-hidden"
                onClick={scrollToFeatures}
              >
                <span className="relative z-10 flex items-center">
                  Learn More
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></span>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How Kolekto Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 kolekto-card">
                <div className="w-16 h-16 bg-kolekto-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-kolekto">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Create a Collection</h3>
                <p className="text-gray-600">
                  Set up your collection with a title, amount, and customize what information you need from participants.
                </p>
              </div>
              
              <div className="text-center p-6 kolekto-card">
                <div className="w-16 h-16 bg-kolekto-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-kolekto">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Share the Link or QR Code</h3>
                <p className="text-gray-600">
                  Distribute your collection to participants via a unique link or scannable QR code.
                </p>
              </div>
              
              <div className="text-center p-6 kolekto-card">
                <div className="w-16 h-16 bg-kolekto-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-kolekto">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Track Payments & Export Data</h3>
                <p className="text-gray-600">
                  Monitor incoming payments in real-time and export participant details whenever you need.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Use Cases Section */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Perfect For</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="kolekto-card p-6">
                <h3 className="text-xl font-semibold mb-3">Students</h3>
                <p className="text-gray-600">
                  Collect class dues, project contributions, or event fees with detailed participant tracking.
                </p>
              </div>
              
              <div className="kolekto-card p-6">
                <h3 className="text-xl font-semibold mb-3">Community Groups</h3>
                <p className="text-gray-600">
                  Organize contributions for community initiatives with transparent record-keeping.
                </p>
              </div>
              
              <div className="kolekto-card p-6">
                <h3 className="text-xl font-semibold mb-3">Transport Teams</h3>
                <p className="text-gray-600">
                  Manage passenger payments and details for group transportation services.
                </p>
              </div>
              
              <div className="kolekto-card p-6">
                <h3 className="text-xl font-semibold mb-3">Event Organizers</h3>
                <p className="text-gray-600">
                  Sell tickets and gather attendee information for small to medium events.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <FaqSection />
        
        {/* CTA Section */}
        <section className="py-16 px-4 kolekto-gradient text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Collecting?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of organizers across Africa who use Kolekto to simplify group payments.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-kolekto hover:bg-white/90"
              asChild
            >
              <Link to="/register">Create Your Account</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;

import React from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  const scrollToFeatures = () => {
    if (location.pathname === '/') {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#features';
    }
  };

  return (
    <footer className="bg-white border-t py-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Logo />
            <p className="mt-1 text-sm text-gray-600">
              Smart payment collection for communities across Africa.
            </p>
          </div>
          
          <div className="col-span-1">
            <h3 className="font-semibold text-sm mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToFeatures();
                  }} 
                  className="text-sm text-gray-600 hover:text-kolekto"
                >
                  Features
                </a>
              </li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-kolekto">FAQ</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="font-semibold text-sm mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-kolekto">About Us</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-kolekto">Contact</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-kolekto">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-kolekto">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="font-semibold text-sm mb-4">Connect</h3>
            <ul className="space-y-2">
              <li><a href="https://x.com/kolektng?s=21" className="text-sm text-gray-600 hover:text-kolekto">Twitter</a></li>
              <li><a href="https://www.facebook.com/share/1AVyxK7Prc/?mibextid=wwXIfr" className="text-sm text-gray-600 hover:text-kolekto">Facebook</a></li>
              <li><a href="https://www.instagram.com/kolekto.ng" className="text-sm text-gray-600 hover:text-kolekto">Instagram</a></li>
              <li><a href="https://www.linkedin.com/company/kolektong/" className="text-sm text-gray-600 hover:text-kolekto">Linkedin</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-gray-600 text-center">
            © {currentYear} Kolekto. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
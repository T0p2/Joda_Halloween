import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-black bg-opacity-50 backdrop-blur-sm border-b border-white border-opacity-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="text-2xl font-bold text-white">
              🎫 TicketApp
            </div>
          </Link>

          {/* Navigation - Simplified */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className="text-white hover:text-yellow-400 transition-colors duration-200"
            >
              Inicio
            </Link>
            <Link 
              to="/events" 
              className="text-white hover:text-yellow-400 transition-colors duration-200"
            >
              Eventos
            </Link>
            <Link 
              to="/admin" 
              className="text-white hover:text-yellow-400 transition-colors duration-200"
            >
              Admin
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-white hover:text-yellow-400 transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

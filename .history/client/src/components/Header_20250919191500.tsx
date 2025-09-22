import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap, Home, Calendar, Shield, User } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="group flex items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 w-10 h-10 rounded-2xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 w-10 h-10 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </div>
            <div className="text-2xl font-black bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
              TicketApp
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-2">
            <Link 
              to="/" 
              className={`group relative px-4 py-2 rounded-xl transition-all duration-300 flex items-center font-semibold ${
                isActive('/') 
                  ? 'text-orange-300 bg-orange-600/20 border border-orange-500/30' 
                  : 'text-white hover:text-orange-300 hover:bg-white/10'
              }`}
            >
              <Home className="w-4 h-4 mr-2" />
              Inicio
              {isActive('/') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full" />
              )}
            </Link>
            <Link 
              to="/events" 
              className={`group relative px-4 py-2 rounded-xl transition-all duration-300 flex items-center font-semibold ${
                isActive('/events') 
                  ? 'text-orange-300 bg-orange-600/20 border border-orange-500/30' 
                  : 'text-white hover:text-orange-300 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Eventos
              {isActive('/events') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full" />
              )}
            </Link>
            <Link 
              to="/my-tickets" 
              className={`group relative px-4 py-2 rounded-xl transition-all duration-300 flex items-center font-semibold ${
                isActive('/my-tickets') 
                  ? 'text-orange-300 bg-orange-600/20 border border-orange-500/30' 
                  : 'text-white hover:text-orange-300 hover:bg-white/10'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Mis Entradas
              {isActive('/my-tickets') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full" />
              )}
            </Link>
            <Link 
              to="/admin" 
              className={`group relative px-4 py-2 rounded-xl transition-all duration-300 flex items-center font-semibold ${
                isActive('/admin') 
                  ? 'text-orange-300 bg-orange-600/20 border border-orange-500/30' 
                  : 'text-white hover:text-orange-300 hover:bg-white/10'
              }`}
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin
              {isActive('/admin') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full" />
              )}
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="text-white hover:text-orange-300 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="space-y-2">
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  isActive('/') 
                    ? 'text-orange-300 bg-orange-600/20 border border-orange-500/30' 
                    : 'text-white hover:text-orange-300 hover:bg-white/10'
                }`}
              >
                <Home className="w-5 h-5 mr-3" />
                Inicio
              </Link>
              <Link 
                to="/events" 
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  isActive('/events') 
                    ? 'text-orange-300 bg-orange-600/20 border border-orange-500/30' 
                    : 'text-white hover:text-orange-300 hover:bg-white/10'
                }`}
              >
                <Calendar className="w-5 h-5 mr-3" />
                Eventos
              </Link>
              <Link 
                to="/my-tickets" 
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  isActive('/my-tickets') 
                    ? 'text-orange-300 bg-orange-600/20 border border-orange-500/30' 
                    : 'text-white hover:text-orange-300 hover:bg-white/10'
                }`}
              >
                <User className="w-5 h-5 mr-3" />
                Mis Entradas
              </Link>
              <Link 
                to="/admin" 
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  isActive('/admin') 
                    ? 'text-orange-300 bg-orange-600/20 border border-orange-500/30' 
                    : 'text-white hover:text-orange-300 hover:bg-white/10'
                }`}
              >
                <Shield className="w-5 h-5 mr-3" />
                Admin
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

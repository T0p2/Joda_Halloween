import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-black bg-opacity-50 backdrop-blur-sm border-b border-white border-opacity-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-4">
          {/* Logo Centered */}
          <Link to="/" className="flex items-center">
            <div className="text-2xl sm:text-3xl font-bold text-white hover:text-yellow-400 transition-colors duration-200">
              🎃 Halloween Party 2025
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;

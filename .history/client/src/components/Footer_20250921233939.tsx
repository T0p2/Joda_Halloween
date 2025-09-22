import React from 'react';
import { Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-4 mb-4">
            <a 
              href="https://instagram.com/nachoayerbe_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-300 hover:text-pink-400 transition-colors duration-200"
            >
              <Instagram className="w-5 h-5" />
              <span>@nachoayerbe_</span>
            </a>
          </div>
          
          <p className="text-gray-400 text-sm">
            © 2024 Halloween Party. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

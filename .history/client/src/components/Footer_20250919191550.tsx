import React from 'react';
import { Zap, Mail, Phone, MapPin, Clock, Heart, Shield, Star, Music, Users, Calendar } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-gradient-to-br from-black via-purple-900/30 to-orange-900/20 text-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 animate-float opacity-20">
          <div className="w-3 h-3 bg-orange-500 rounded-full" />
        </div>
        <div className="absolute top-20 right-20 animate-float-delay opacity-30">
          <div className="w-4 h-4 bg-purple-500 rounded-full" />
        </div>
        <div className="absolute bottom-20 left-1/2 animate-float opacity-25">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-5">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 w-12 h-12 rounded-2xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-black bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
                TicketApp
              </span>
            </div>
            <p className="text-gray-300 mb-6 text-lg leading-relaxed">
              La plataforma más épica para vivir las mejores fiestas. 
              <span className="text-orange-300 font-semibold"> Pagos seguros</span>, 
              <span className="text-orange-300 font-semibold"> códigos QR únicos</span> y 
              <span className="text-orange-300 font-semibold"> experiencias inolvidables</span>.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-2xl font-black text-orange-400">100K+</div>
                <div className="text-xs text-gray-400">Entradas Vendidas</div>
              </div>
              <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-2xl font-black text-orange-400">500+</div>
                <div className="text-xs text-gray-400">Eventos Épicos</div>
              </div>
              <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-2xl font-black text-orange-400">50K+</div>
                <div className="text-xs text-gray-400">Fiesteros Felices</div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-300 hover:text-orange-300 transition-colors cursor-pointer">
                <Mail className="w-5 h-5 mr-3 text-orange-400" />
                <span>info@ticketapp.com</span>
              </div>
              <div className="flex items-center text-gray-300 hover:text-orange-300 transition-colors cursor-pointer">
                <Phone className="w-5 h-5 mr-3 text-orange-400" />
                <span>+54 9 11 1234-5678</span>
              </div>
              <div className="flex items-center text-gray-300 hover:text-orange-300 transition-colors cursor-pointer">
                <MapPin className="w-5 h-5 mr-3 text-orange-400" />
                <span>Buenos Aires, Argentina</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Clock className="w-5 h-5 mr-3 text-orange-400" />
                <span>24/7 Soporte para fiestas</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Music className="w-5 h-5 mr-2 text-orange-400" />
              Navegación
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/events" className="group flex items-center text-gray-300 hover:text-orange-300 transition-all duration-200">
                  <Calendar className="w-4 h-4 mr-2 opacity-60 group-hover:opacity-100 group-hover:text-orange-400" />
                  Eventos
                </a>
              </li>
              <li>
                <a href="/my-tickets" className="group flex items-center text-gray-300 hover:text-orange-300 transition-all duration-200">
                  <Users className="w-4 h-4 mr-2 opacity-60 group-hover:opacity-100 group-hover:text-orange-400" />
                  Mis Entradas
                </a>
              </li>
              <li>
                <a href="/login" className="group flex items-center text-gray-300 hover:text-orange-300 transition-all duration-200">
                  <Zap className="w-4 h-4 mr-2 opacity-60 group-hover:opacity-100 group-hover:text-orange-400" />
                  Iniciar Sesión
                </a>
              </li>
              <li>
                <a href="/register" className="group flex items-center text-gray-300 hover:text-orange-300 transition-all duration-200">
                  <Star className="w-4 h-4 mr-2 opacity-60 group-hover:opacity-100 group-hover:text-orange-400" />
                  Registrarse
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-orange-400" />
              Soporte
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-orange-300 transition-colors duration-200 flex items-center">
                  <span>Centro de Ayuda</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-orange-300 transition-colors duration-200 flex items-center">
                  <span>Contacto</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-orange-300 transition-colors duration-200 flex items-center">
                  <span>Términos de Uso</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-orange-300 transition-colors duration-200 flex items-center">
                  <span>Privacidad</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Social / Newsletter */}
          <div className="col-span-1 md:col-span-3">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-orange-400" />
              ¡Súmate a la fiesta!
            </h3>
            <p className="text-gray-300 mb-4">
              Sé el primero en enterarte de los eventos más épicos.
            </p>
            
            <div className="mb-6">
              <div className="flex">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-l-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500/50 transition-all"
                />
                <button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-6 py-3 rounded-r-xl font-bold transition-all duration-300 transform hover:scale-105">
                  🚀
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
                <Shield className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Pago Seguro</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
                <Zap className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Entrega Rápida</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
                <Heart className="w-6 h-6 text-red-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Soporte 24/7</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-center md:text-left mb-4 md:mb-0">
              © 2024 TicketApp. Todos los derechos reservados. 
              <span className="text-orange-400 ml-2">Hecho con ❤️ para los fiesteros</span>
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="#" className="bg-white/10 hover:bg-orange-500/20 p-2 rounded-lg transition-all duration-300 hover:scale-110">
                <div className="w-5 h-5 bg-gradient-to-r from-orange-400 to-red-600 rounded" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-purple-500/20 p-2 rounded-lg transition-all duration-300 hover:scale-110">
                <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-600 rounded" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-blue-500/20 p-2 rounded-lg transition-all duration-300 hover:scale-110">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-cyan-600 rounded" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

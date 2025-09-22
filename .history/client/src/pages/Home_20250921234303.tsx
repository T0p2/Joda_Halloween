import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const event = {
    id: 1,
    name: "🎃 Fiesta de Halloween 2025 👻",
    description: "La fiesta de Halloween más terrorífica del año. Una noche de miedo y diversión que no te puedes perder.",
    date: "15 de Julio, 2025",
    time: "22:00 - 06:00",
    location: "SECRET LOCATION",
    price: 5000,
    image: "https://static.vecteezy.com/system/resources/previews/027/807/583/non_2x/spooky-halloween-wallpaper-with-pumpkin-and-old-house-free-photo.jpg"
  };

  const handleBuyTicket = () => {
    navigate('/buy-ticket', { state: { event } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${event.image})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto">
          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 animate-pulse text-orange-400 drop-shadow-2xl">
            🎃 HALLOWEEN 2025 👻
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto leading-relaxed">
            La fiesta más terrorífica del año te está esperando... ¿Te atreves?
          </p>

          {/* Event Details - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-12 text-center">
            <div className="flex flex-col items-center bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-4 sm:p-6">
              <Calendar className="w-8 h-8 mb-3 text-yellow-400" />
              <span className="font-bold text-lg sm:text-xl">{event.date}</span>
              <span className="text-gray-300 text-sm sm:text-base">{event.time}</span>
            </div>
            
            <div className="flex flex-col items-center bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-4 sm:p-6">
              <MapPin className="w-8 h-8 mb-3 text-yellow-400" />
              <span className="font-bold text-lg sm:text-xl">{event.location}</span>
              <span className="text-gray-300 text-sm sm:text-base">📍 Ubicación Secreta</span>
            </div>
            
            <div className="flex flex-col items-center bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-4 sm:p-6">
              <Users className="w-8 h-8 mb-3 text-yellow-400" />
              <span className="font-bold text-lg sm:text-xl">${event.price}</span>
              <span className="text-gray-300 text-sm sm:text-base">por entrada</span>
            </div>
          </div>

          {/* Buy Button - Responsive */}
          <button
            onClick={handleBuyTicket}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 sm:py-6 px-8 sm:px-12 rounded-full text-lg sm:text-2xl transform hover:scale-105 transition-all duration-300 shadow-2xl animate-bounce border-4 border-yellow-400"
          >
            🎫 COMPRAR ENTRADA 👻
          </button>

          {/* Halloween Emojis Animation */}
          <div className="mt-12 text-4xl sm:text-6xl animate-pulse">
            🦇 🕷️ 🕸️ 💀 🎃 💀 🕸️ 🕷️ 🦇
          </div>
        </div>

        {/* Scroll Indicator - Hidden on small screens */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden sm:block">
          <div className="w-6 h-10 border-2 border-orange-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-orange-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

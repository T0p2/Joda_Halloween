import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Star } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const event = {
    id: 1,
    name: "Fiesta de Halloween 2025",
    description: "La fiesta de Halloween más terrorífica del año con música electrónica, DJs internacionales, open bar, decoración temática y sorpresas escalofriantes. Una noche de miedo que no te puedes perder.",
    date: "15 de Julio, 2025",
    time: "22:00 - 06:00",
    location: "SECRET LOCATION",
    price: 5000,
    image: "https://static.vecteezy.com/system/resources/previews/027/807/583/non_2x/spooky-halloween-wallpaper-with-pumpkin-and-old-house-free-photo.jpg",
    features: [
      "Música electrónica",
      "DJs internacionales", 
      "Open bar",
      "Decoración temática",
      "Fotógrafo profesional",
      "Sorpresas escalofriantes"
    ]
  };

  const handleBuyTicket = () => {
    navigate('/buy-ticket', { state: { event } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${event.image})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            {event.name}
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-200 animate-slide-up">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
            <div className="flex flex-col items-center">
              <Calendar className="w-8 h-8 mb-2 text-yellow-400" />
              <span className="font-semibold">{event.date}</span>
              <span className="text-gray-300">{event.time}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <MapPin className="w-8 h-8 mb-2 text-yellow-400" />
              <span className="font-semibold">{event.location}</span>
            </div>
            
                         <div className="flex flex-col items-center">
               <Users className="w-8 h-8 mb-2 text-yellow-400" />
               <span className="font-semibold">${event.price}</span>
               <span className="text-gray-300">por entrada</span>
             </div>
          </div>

          {/* Buy Button */}
          <button
            onClick={handleBuyTicket}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-full text-xl transform hover:scale-105 transition-all duration-300 shadow-2xl animate-pulse"
          >
            🎫 COMPRAR ENTRADA
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 bg-black bg-opacity-30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            ¿Qué incluye tu entrada?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {event.features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-opacity-20 transition-all duration-300"
              >
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

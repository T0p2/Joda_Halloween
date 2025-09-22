import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Star, Music, Zap, Camera, Gift } from 'lucide-react';

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
      { name: "Música electrónica", icon: Music, description: "Los mejores beats y ritmos" },
      { name: "DJs internacionales", icon: Users, description: "Artistas de talla mundial" },
      { name: "Open bar", icon: Gift, description: "Bebidas ilimitadas toda la noche" },
      { name: "Decoración temática", icon: Star, description: "Ambientación terrorífica única" },
      { name: "Fotógrafo profesional", icon: Camera, description: "Captura todos los momentos" },
      { name: "Sorpresas escalofriantes", icon: Zap, description: "Experiencias que no olvidarás" }
    ]
  };

  const handleBuyTicket = () => {
    navigate('/buy-ticket', { state: { event } });
  };

  const handleViewAllEvents = () => {
    navigate('/events');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${event.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 animate-float">
            <div className="w-4 h-4 bg-orange-500 rounded-full opacity-60" />
          </div>
          <div className="absolute top-40 right-20 animate-float-delay">
            <div className="w-6 h-6 bg-purple-500 rounded-full opacity-40" />
          </div>
          <div className="absolute bottom-40 left-20 animate-float">
            <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-70" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-6 max-w-6xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center bg-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 mr-2 text-orange-400" />
            <span className="text-orange-300 font-medium">Evento Exclusivo</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
            {event.name}
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {event.description}
          </p>

          {/* Event Details Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Calendar className="w-8 h-8 mb-3 text-orange-400 mx-auto" />
              <div className="text-lg font-bold">{event.date}</div>
              <div className="text-gray-300">{event.time}</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <MapPin className="w-8 h-8 mb-3 text-orange-400 mx-auto" />
              <div className="text-lg font-bold">{event.location}</div>
              <div className="text-gray-300">Ubicación exclusiva</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <Users className="w-8 h-8 mb-3 text-orange-400 mx-auto" />
              <div className="text-lg font-bold">${event.price.toLocaleString()}</div>
              <div className="text-gray-300">por entrada</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleBuyTicket}
              className="group relative bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-full text-xl transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              <span className="relative z-10 flex items-center justify-center">
                🎫 COMPRAR ENTRADA
                <Zap className="w-5 h-5 ml-2 group-hover:animate-bounce" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </button>

            <button
              onClick={handleViewAllEvents}
              className="border-2 border-white/30 text-white hover:bg-white/10 font-bold py-4 px-8 rounded-full text-xl transition-all duration-300 backdrop-blur-sm"
            >
              Ver Todos los Eventos
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-12 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-orange-400 rounded-full mt-3 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6 bg-gradient-to-b from-black to-purple-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-4 bg-gradient-to-r from-orange-400 to-purple-600 bg-clip-text text-transparent">
              ¿Qué incluye tu entrada?
            </h2>
            <p className="text-xl text-gray-300">Una experiencia completa que no olvidarás</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {event.features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={index}
                  className="group bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/10 hover:border-orange-500/30 hover:from-white/10 hover:to-white/20 transition-all duration-500 transform hover:-translate-y-2"
                >
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors">
                    {feature.name}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 px-6 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            ¡No te quedes sin tu entrada!
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Las entradas son limitadas y se agotan rápido. Asegura tu lugar en la fiesta más épica del año.
          </p>
          <button
            onClick={handleBuyTicket}
            className="bg-white text-orange-600 hover:bg-orange-50 font-black py-4 px-10 rounded-full text-2xl transform hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            🚀 COMPRAR AHORA
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;

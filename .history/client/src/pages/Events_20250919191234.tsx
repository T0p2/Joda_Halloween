import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Search, Star, Zap, Music, Sparkles } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  price: number;
  total_tickets: number;
  available_tickets: number;
  image_url: string;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/tickets/events');
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error al cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500/30 border-t-orange-500 mx-auto mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-orange-400 animate-pulse" />
          </div>
          <p className="text-orange-300 font-semibold">Cargando eventos épicos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-6 h-6 bg-orange-500 rounded-full opacity-20" />
        </div>
        <div className="absolute top-40 right-20 animate-float-delay">
          <div className="w-8 h-8 bg-purple-500 rounded-full opacity-30" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float">
          <div className="w-4 h-4 bg-yellow-500 rounded-full opacity-40" />
        </div>
      </div>

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-full px-6 py-3 mb-6">
              <Music className="w-5 h-5 mr-3 text-orange-400" />
              <span className="text-orange-300 font-semibold">Descubre Eventos Increíbles</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent">
              Eventos Épicos
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Las fiestas más salvajes, la música más increíble y las experiencias más inolvidables te esperan. 
              ¡Encuentra tu próxima aventura!
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-orange-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar eventos, ubicaciones, géneros musicales..."
                  className="w-full pl-12 pr-6 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-500/50 focus:bg-white/20 transition-all duration-300 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-12 max-w-md mx-auto border border-white/10">
                <div className="text-orange-400 mb-6">
                  <Calendar className="w-20 h-20 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  No se encontraron eventos
                </h3>
                <p className="text-gray-400 text-lg">
                  {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'No hay eventos disponibles en este momento. ¡Pronto habrá más diversión!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/20 hover:border-orange-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Event Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={event.image_url}
                      alt={event.name}
                      className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';
                      }}
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                      {formatPrice(event.price)}
                    </div>
                    
                    {/* Availability Badges */}
                    {event.available_tickets < 10 && event.available_tickets > 0 && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">
                        <Zap className="w-4 h-4 inline mr-1" />
                        ¡Últimas entradas!
                      </div>
                    )}
                    {event.available_tickets === 0 && (
                      <div className="absolute top-4 left-4 bg-gray-600/90 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                        Agotado
                      </div>
                    )}

                    {/* Popularity Badge */}
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-semibold">Popular</span>
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="p-6 space-y-4">
                    <h3 className="text-2xl font-bold text-white group-hover:text-orange-300 transition-colors line-clamp-2">
                      {event.name}
                    </h3>
                    
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center text-gray-300">
                        <Calendar className="w-5 h-5 mr-3 text-orange-400" />
                        <span className="text-sm font-medium">{formatDate(event.date)}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-300">
                        <MapPin className="w-5 h-5 mr-3 text-orange-400" />
                        <span className="text-sm font-medium">{event.location}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-300">
                        <Users className="w-5 h-5 mr-3 text-orange-400" />
                        <span className="text-sm font-medium">
                          {event.available_tickets} de {event.total_tickets} entradas disponibles
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-1000"
                        style={{ width: `${((event.total_tickets - event.available_tickets) / event.total_tickets) * 100}%` }}
                      />
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                      {event.available_tickets > 0 ? (
                        <Link
                          to={`/events/${event.id}`}
                          className="group/btn relative w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-2xl text-center block transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden"
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            Ver Detalles
                            <Sparkles className="w-4 h-4 ml-2 group-hover/btn:animate-spin" />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-gray-600/50 text-gray-400 font-bold py-3 px-6 rounded-2xl cursor-not-allowed border border-gray-600"
                        >
                          Agotado
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              ))}
            </div>
          )}

          {/* Stats Section */}
          <div className="mt-20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="group">
                <div className="text-5xl font-black mb-3 bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  {events.length}
                </div>
                <div className="text-gray-400 font-semibold">Eventos Activos</div>
                <Music className="w-8 h-8 text-orange-400 mx-auto mt-2 opacity-60" />
              </div>
              <div className="group">
                <div className="text-5xl font-black mb-3 bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  {events.reduce((sum, event) => sum + event.total_tickets, 0).toLocaleString()}
                </div>
                <div className="text-gray-400 font-semibold">Total de Entradas</div>
                <Users className="w-8 h-8 text-orange-400 mx-auto mt-2 opacity-60" />
              </div>
              <div className="group">
                <div className="text-5xl font-black mb-3 bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  {events.reduce((sum, event) => sum + event.available_tickets, 0).toLocaleString()}
                </div>
                <div className="text-gray-400 font-semibold">Entradas Disponibles</div>
                <Zap className="w-8 h-8 text-orange-400 mx-auto mt-2 opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;

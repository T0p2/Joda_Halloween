import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Search } from 'lucide-react';
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
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Eventos Disponibles
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre los mejores eventos y fiestas. Compra tus entradas de forma segura y recibe tu código QR por email.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar eventos o ubicaciones..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron eventos
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'No hay eventos disponibles en este momento.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <div key={event.id} className="card hover:shadow-lg transition-shadow duration-300">
                {/* Event Image */}
                <div className="relative mb-4">
                  <img
                    src={event.image_url}
                    alt={event.name}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {formatPrice(event.price)}
                  </div>
                  {event.available_tickets < 10 && event.available_tickets > 0 && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ¡Últimas entradas!
                    </div>
                  )}
                  {event.available_tickets === 0 && (
                    <div className="absolute top-4 left-4 bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Agotado
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {event.name}
                  </h3>
                  
                  <p className="text-gray-600 line-clamp-3">
                    {event.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">{formatDate(event.date)}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {event.available_tickets} de {event.total_tickets} entradas disponibles
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    {event.available_tickets > 0 ? (
                      <Link
                        to={`/events/${event.id}`}
                        className="w-full btn-primary text-center block"
                      >
                        Ver Detalles
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 font-medium py-2 px-4 rounded-lg cursor-not-allowed"
                      >
                        Agotado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {events.length}
              </div>
              <div className="text-gray-600">Eventos Activos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {events.reduce((sum, event) => sum + event.total_tickets, 0)}
              </div>
              <div className="text-gray-600">Total de Entradas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {events.reduce((sum, event) => sum + event.available_tickets, 0)}
              </div>
              <div className="text-gray-600">Entradas Disponibles</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;

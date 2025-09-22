import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Users, Ticket, ArrowLeft, Minus, Plus } from 'lucide-react';
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

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`/api/tickets/events/${id}`);
      setEvent(response.data.event);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Error al cargar el evento');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= Math.min(10, event?.available_tickets || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para comprar entradas');
      navigate('/login');
      return;
    }

    if (!event) return;

    // Navigate to BuyTicket page to collect attendee data
    navigate('/buy-ticket', {
      state: {
        event: event,
        quantity: quantity
      }
    });
  };

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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Evento no encontrado</h2>
          <button
            onClick={() => navigate('/events')}
            className="btn-primary"
          >
            Volver a Eventos
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = event.price * quantity;
  const isSoldOut = event.available_tickets === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Eventos
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Image */}
          <div>
            <img
              src={event.image_url}
              alt={event.name}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';
              }}
            />
          </div>

          {/* Event Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {event.name}
              </h1>
              <p className="text-gray-600 text-lg">
                {event.description}
              </p>
            </div>

            {/* Event Info */}
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3" />
                <span>{formatDate(event.date)}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-3" />
                <span>{event.location}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Users className="w-5 h-5 mr-3" />
                <span>
                  {event.available_tickets} de {event.total_tickets} entradas disponibles
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {formatPrice(event.price)}
              </div>
              <div className="text-gray-600">por entrada</div>
            </div>

            {/* Purchase Section */}
            {!isSoldOut ? (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Comprar Entradas
                </h3>
                
                {/* Quantity Selector */}
                <div className="flex items-center justify-between mb-4">
                  <label className="text-gray-700 font-medium">Cantidad:</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= Math.min(10, event.available_tickets)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={handlePurchase}
                  disabled={purchasing || !user}
                  className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : !user ? (
                    'Inicia sesión para comprar'
                  ) : (
                    <div className="flex items-center justify-center">
                      <Ticket className="w-5 h-5 mr-2" />
                      Comprar {quantity} Entrada{quantity > 1 ? 's' : ''}
                    </div>
                  )}
                </button>

                {!user && (
                  <p className="text-sm text-gray-600 text-center mt-3">
                    <button
                      onClick={() => navigate('/login')}
                      className="text-primary-600 hover:text-primary-500 font-medium"
                    >
                      Iniciar sesión
                    </button>
                    {' '}o{' '}
                    <button
                      onClick={() => navigate('/register')}
                      className="text-primary-600 hover:text-primary-500 font-medium"
                    >
                      registrarse
                    </button>
                    {' '}para continuar
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 text-center">
                <div className="text-gray-500 mb-2">
                  <Ticket className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Entradas Agotadas
                </h3>
                <p className="text-gray-600">
                  Lo sentimos, todas las entradas para este evento han sido vendidas.
                </p>
              </div>
            )}

            {/* Features */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ¿Qué incluye tu entrada?
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  Acceso completo al evento
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  Código QR único para validación
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  Envío por email inmediato
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  Pago seguro con MercadoPago
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;

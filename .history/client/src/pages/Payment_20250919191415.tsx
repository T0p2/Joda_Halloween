import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, CheckCircle, Shield, Users, Calendar, MapPin, Sparkles, Lock, Star } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import apiConfig from '../config/api';
import ServerStatus from '../components/ServerStatus';

interface AttendeeData {
  name: string;
  email: string;
  dni: string;
  phone: string;
}

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  price: number;
}

interface PaymentState {
  event: Event;
  attendees: AttendeeData[];
  quantity: number;
  totalPrice: number;
}

const Payment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const paymentState = location.state as PaymentState;

  useEffect(() => {
    if (!paymentState) {
      navigate('/events');
      return;
    }
  }, [paymentState, navigate]);

  if (!paymentState) {
    return null;
  }

  const { event, attendees, quantity, totalPrice } = paymentState;

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

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Get user from localStorage or context
      const token = localStorage.getItem('token');
      let userId = null;
      
      if (token) {
        // Decode token to get user ID (you might want to add this to AuthContext)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId;
        } catch (e) {
          console.warn('Could not decode token');
        }
      }

      console.log('🚀 Initiating payment for:', {
        event: event.name,
        quantity,
        totalPrice,
        attendeesCount: attendees.length
      });

      const response = await axios.post(apiConfig.endpoints.mercadopago.createPreference, {
        event,
        attendees,
        totalPrice,
        quantity,
        userId
      });

      console.log('✅ Payment preference created:', response.data);

      if (response.data.success) {
        // Store payment reference for tracking
        sessionStorage.setItem('paymentReference', response.data.externalReference);
        sessionStorage.setItem('paymentData', JSON.stringify({
          event,
          attendees,
          quantity,
          totalPrice
        }));

        // Redirect to MercadoPago
        window.location.href = response.data.initPoint;
      } else {
        toast.error(response.data.error || 'Error al crear el pago');
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      
      let errorMessage = 'Error al procesar el pago';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Show specific error for configuration issues
      if (error.response?.status === 500 && error.response?.data?.details?.includes('MERCADOPAGO_ACCESS_TOKEN')) {
        toast.error('Error de configuración: Verifica las credenciales de MercadoPago', {
          duration: 10000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-4 h-4 bg-orange-500 rounded-full opacity-30" />
        </div>
        <div className="absolute top-60 right-20 animate-float-delay">
          <div className="w-6 h-6 bg-purple-500 rounded-full opacity-40" />
        </div>
        <div className="absolute bottom-40 left-40 animate-float">
          <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-50" />
        </div>
      </div>

      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-orange-300 hover:text-orange-400 transition-all duration-200 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 hover:border-orange-500/30"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-semibold">Volver</span>
            </button>
            <ServerStatus />
          </div>

          {/* Page Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-full px-6 py-3 mb-6">
              <CreditCard className="w-5 h-5 mr-3 text-orange-400" />
              <span className="text-orange-300 font-semibold">Finalizar Compra</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent">
              ¡Ya casi es tuyo!
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Último paso para asegurar tu lugar en esta experiencia increíble
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              {/* Event Summary Card */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-orange-500/30 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Resumen del Pedido
                  </h2>
                </div>

                <div className="bg-black/20 rounded-2xl p-6 mb-6">
                  <h3 className="text-2xl font-bold text-orange-300 mb-4">
                    {event.name}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-300">
                      <Calendar className="w-5 h-5 mr-3 text-orange-400" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <MapPin className="w-5 h-5 mr-3 text-orange-400" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Users className="w-5 h-5 mr-3 text-orange-400" />
                      <span>{quantity} entrada{quantity > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-2xl p-6 border border-orange-500/30">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-300">Precio por entrada:</span>
                    <span className="font-bold text-white">{formatPrice(event.price)}</span>
                  </div>
                  <div className="flex justify-between items-center text-2xl font-black">
                    <span className="text-white">Total:</span>
                    <span className="bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendees List */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Datos de los Asistentes
                  </h3>
                </div>
                <div className="space-y-4">
                  {attendees.map((attendee, index) => (
                    <div key={index} className="bg-black/20 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300">
                      <h4 className="font-bold text-orange-300 mb-3 text-lg">
                        🎫 Persona {index + 1}: {attendee.name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-300">
                        <div className="flex items-center">
                          <span className="font-semibold mr-2">Email:</span>
                          <span className="text-orange-200">{attendee.email}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold mr-2">DNI:</span>
                          <span className="text-orange-200">{attendee.dni}</span>
                        </div>
                        <div className="flex items-center sm:col-span-2">
                          <span className="font-semibold mr-2">Teléfono:</span>
                          <span className="text-orange-200">{attendee.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-6">
              {/* Security Info */}
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-3xl p-8 border border-green-500/30">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Pago 100% Seguro
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-green-200">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Encriptación SSL de 256 bits</span>
                  </div>
                  <div className="flex items-center text-green-200">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Protección MercadoPago</span>
                  </div>
                  <div className="flex items-center text-green-200">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Datos personales seguros</span>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Métodos de Pago
                  </h2>
                </div>

                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 mb-8">
                  <h4 className="font-bold text-blue-200 mb-4 text-lg">
                    💳 Paga como prefieras
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-blue-100">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-400" />
                      <span>Tarjetas de crédito</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-400" />
                      <span>Tarjetas de débito</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-400" />
                      <span>Transferencia bancaria</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-400" />
                      <span>Pago en efectivo</span>
                    </div>
                    <div className="flex items-center col-span-2">
                      <Star className="w-4 h-4 mr-2 text-yellow-400" />
                      <span>Billeteras digitales</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="group relative w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-black py-6 px-8 rounded-2xl text-xl transform hover:scale-105 transition-all duration-300 shadow-2xl overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-3 border-white/30 border-t-white mr-3"></div>
                        <span>Procesando tu pago...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-6 h-6 mr-3" />
                        <span>Pagar {formatPrice(totalPrice)} con MercadoPago</span>
                        <Sparkles className="w-5 h-5 ml-3 group-hover:animate-spin" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                </button>

                <div className="text-center text-gray-400 mt-6">
                  <p className="text-sm">
                    Al completar tu compra, aceptas nuestros{' '}
                    <span className="text-orange-400 hover:text-orange-300 cursor-pointer underline">
                      términos y condiciones
                    </span>
                  </p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-center space-x-6 text-gray-400">
                  <div className="text-center">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <span className="text-xs font-semibold">SSL Seguro</span>
                  </div>
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                    <span className="text-xs font-semibold">Verificado</span>
                  </div>
                  <div className="text-center">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                    <span className="text-xs font-semibold">Encriptado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
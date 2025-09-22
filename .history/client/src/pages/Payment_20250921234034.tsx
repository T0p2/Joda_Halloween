import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import apiConfig from '../config/api';

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
    return new Intl.NumberFormat('es-ES', {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="flex justify-start items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Resumen del Pedido
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {event.name}
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center">
                      <span className="w-20">Fecha:</span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20">Ubicación:</span>
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20">Cantidad:</span>
                      <span>{quantity} entrada{quantity > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Precio por entrada:</span>
                    <span className="font-semibold">{formatPrice(event.price)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendees List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Datos de los Asistentes
              </h3>
              <div className="space-y-4">
                {attendees.map((attendee, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Persona {index + 1}: {attendee.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><strong>Email:</strong> {attendee.email}</div>
                      <div><strong>DNI:</strong> {attendee.dni}</div>
                      <div><strong>Teléfono:</strong> {attendee.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">
                Finalizar Compra
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Métodos de Pago Disponibles
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Tarjetas de crédito y débito</li>
                  <li>• Transferencia bancaria</li>
                  <li>• Pago en efectivo</li>
                  <li>• Billeteras digitales</li>
                </ul>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pagar con MercadoPago {formatPrice(totalPrice)}
                  </>
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                <p>
                  Al completar tu compra, aceptas nuestros{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    términos y condiciones
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
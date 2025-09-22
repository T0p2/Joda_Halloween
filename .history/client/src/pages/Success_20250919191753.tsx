import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Mail, Ticket, ArrowLeft, QrCode, Loader, AlertCircle, Sparkles, Star, Gift, Zap } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import apiConfig from '../config/api';

interface PaymentStatus {
  preference: {
    status: string;
    external_reference: string;
    total_amount: number;
    created_at: string;
  };
  payment?: {
    status: string;
    status_detail: string;
    transaction_amount: number;
  };
}

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string>('');

  const paymentReference = searchParams.get('ref') || sessionStorage.getItem('paymentReference');
  const paymentData = sessionStorage.getItem('paymentData');
  const parsedPaymentData = paymentData ? JSON.parse(paymentData) : null;

  useEffect(() => {
    if (!paymentReference) {
      navigate('/events');
      return;
    }

    checkPaymentStatus();
  }, [paymentReference, navigate]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Checking payment status for reference:', paymentReference);
      
      const response = await axios.get(
        apiConfig.endpoints.mercadopago.paymentStatus(paymentReference)
      );

      if (response.data.success) {
        setPaymentStatus(response.data);
        console.log('✅ Payment status retrieved:', response.data);
      } else {
        setError('No se pudo verificar el estado del pago');
      }
    } catch (error: any) {
      console.error('❌ Error checking payment status:', error);
      setError('Error al verificar el pago');
    } finally {
      setLoading(false);
    }
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
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'text-green-400';
      case 'pending':
      case 'in_process':
        return 'text-yellow-400';
      case 'rejected':
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'Completado';
      case 'pending':
      case 'in_process':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleGoToTickets = () => {
    navigate('/my-tickets');
  };

  const handleGoToEvents = () => {
    // Clear session storage
    sessionStorage.removeItem('paymentReference');
    sessionStorage.removeItem('paymentData');
    navigate('/events');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 flex items-center justify-center">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-12 border border-white/20 text-center max-w-md mx-auto">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500/30 border-t-orange-500 mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-orange-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Verificando tu pago...
          </h2>
          <p className="text-gray-300">
            Por favor espera mientras confirmamos tu transacción épica
          </p>
        </div>
      </div>
    );
  }

  if (error || !paymentStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-12 border border-white/20 max-w-2xl mx-auto">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-red-400 to-orange-600 bg-clip-text text-transparent">
                ¡Ups! Algo salió mal
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                {error || 'No se pudo verificar el estado de tu pago'}
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={checkPaymentStatus}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Zap className="w-5 h-5 inline mr-2" />
                  Reintentar Verificación
                </button>
                <button
                  onClick={handleGoToEvents}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl border border-white/20 transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5 inline mr-2" />
                  Volver a Eventos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPaymentSuccessful = paymentStatus.preference.status === 'completed' || 
                             (paymentStatus.payment && paymentStatus.payment.status === 'approved');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-6 h-6 bg-orange-500 rounded-full opacity-20" />
        </div>
        <div className="absolute top-40 right-20 animate-float-delay">
          <div className="w-8 h-8 bg-purple-500 rounded-full opacity-30" />
        </div>
        <div className="absolute bottom-40 left-40 animate-float">
          <div className="w-4 h-4 bg-yellow-500 rounded-full opacity-40" />
        </div>
      </div>

      <div className="relative z-10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Status Header */}
          <div className="text-center mb-16">
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-8 ${
              isPaymentSuccessful 
                ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                : 'bg-gradient-to-br from-yellow-500 to-orange-600'
            }`}>
              {isPaymentSuccessful ? (
                <CheckCircle className="w-12 h-12 text-white" />
              ) : (
                <AlertCircle className="w-12 h-12 text-white" />
              )}
            </div>
            
            {isPaymentSuccessful && (
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-2 text-4xl mb-4">
                  <span>🎉</span>
                  <span>🎊</span>
                  <span>🚀</span>
                </div>
              </div>
            )}

            <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent">
              {isPaymentSuccessful ? '¡Pago Exitoso!' : 'Pago Pendiente'}
            </h1>
            <p className="text-2xl text-gray-300 max-w-2xl mx-auto">
              {isPaymentSuccessful 
                ? '¡Tu entrada está lista! La fiesta te espera 🔥' 
                : 'Tu pago está siendo procesado por los magos de MercadoPago ✨'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Details */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Detalles del Pago
                </h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-black/20 rounded-2xl p-6">
                  <h3 className="font-bold text-orange-300 mb-4 text-lg">Información del Pago</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Referencia:</span>
                      <span className="font-mono text-orange-200 bg-orange-900/20 px-3 py-1 rounded-lg">
                        #{paymentStatus.preference.external_reference.slice(-8)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Estado:</span>
                      <span className={`font-bold ${getStatusColor(paymentStatus.preference.status)}`}>
                        {getStatusText(paymentStatus.preference.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total:</span>
                      <span className="font-bold text-white text-xl">
                        {formatPrice(paymentStatus.preference.total_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Fecha:</span>
                      <span className="text-white">
                        {new Date(paymentStatus.preference.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>

                {paymentStatus.payment && (
                  <div className="bg-black/20 rounded-2xl p-6">
                    <h3 className="font-bold text-purple-300 mb-4 text-lg">Estado MercadoPago</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Estado:</span>
                        <span className={`font-bold ${getStatusColor(paymentStatus.payment.status)}`}>
                          {getStatusText(paymentStatus.payment.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Detalle:</span>
                        <span className="text-white">{paymentStatus.payment.status_detail}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Monto:</span>
                        <span className="font-bold text-white text-xl">
                          {formatPrice(paymentStatus.payment.transaction_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Details */}
            {parsedPaymentData && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Tu Evento
                  </h2>
                </div>
                
                <div className="bg-black/20 rounded-2xl p-6 mb-6">
                  <h3 className="text-2xl font-bold text-orange-300 mb-4">
                    {parsedPaymentData.event.name}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-gray-300">
                    <div className="flex items-center">
                      <span className="font-semibold text-white mr-3">📅 Fecha:</span>
                      <span>{formatDate(parsedPaymentData.event.date)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-white mr-3">📍 Ubicación:</span>
                      <span>{parsedPaymentData.event.location}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-white mr-3">🎫 Entradas:</span>
                      <span>{parsedPaymentData.quantity}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-white mr-3">💰 Precio c/u:</span>
                      <span>{formatPrice(parsedPaymentData.event.price)}</span>
                    </div>
                  </div>
                </div>

                {parsedPaymentData.attendees && parsedPaymentData.attendees.length > 0 && (
                  <div>
                    <h4 className="font-bold text-white mb-4 text-lg flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-orange-400" />
                      Los Fiesteros
                    </h4>
                    <div className="space-y-3">
                      {parsedPaymentData.attendees.map((attendee: any, index: number) => (
                        <div key={index} className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-xl">
                          <div className="font-semibold text-orange-200">🎉 {attendee.name}</div>
                          <div className="text-sm text-gray-400">{attendee.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {isPaymentSuccessful && (
              <button
                onClick={handleGoToTickets}
                className="group bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black py-6 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                <span className="flex items-center justify-center text-xl">
                  <Ticket className="w-6 h-6 mr-3" />
                  Ver Mis Entradas
                  <Sparkles className="w-5 h-5 ml-3 group-hover:animate-spin" />
                </span>
              </button>
            )}
            
            <button
              onClick={handleGoToEvents}
              className="bg-white/10 hover:bg-white/20 text-white font-black py-6 px-8 rounded-2xl border border-white/20 transition-all duration-300 hover:border-orange-500/30"
            >
              <span className="flex items-center justify-center text-xl">
                <ArrowLeft className="w-6 h-6 mr-3" />
                Más Eventos Épicos
              </span>
            </button>
          </div>

          {/* Information Cards */}
          <div className="mt-12">
            {isPaymentSuccessful ? (
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-3xl p-8 border border-green-500/30">
                <h3 className="text-2xl font-bold text-green-300 mb-6 flex items-center">
                  <CheckCircle className="w-7 h-7 mr-3" />
                  ¡Todo listo para la fiesta!
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-green-100">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <QrCode className="w-5 h-5 mr-3 text-green-400" />
                      <span>Tus códigos QR únicos están listos</span>
                    </div>
                    <div className="flex items-center">
                      <Ticket className="w-5 h-5 mr-3 text-green-400" />
                      <span>Consulta tus entradas en "Mis Entradas"</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 mr-3 text-green-400" />
                      <span>Muestra tu QR en la entrada del evento</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-3 text-green-400" />
                      <span>Contacta soporte si necesitas ayuda</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-lg rounded-3xl p-8 border border-yellow-500/30">
                <h3 className="text-2xl font-bold text-yellow-300 mb-6 flex items-center">
                  <Loader className="w-7 h-7 mr-3 animate-spin" />
                  Pago en proceso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-yellow-100">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Zap className="w-5 h-5 mr-3 text-yellow-400" />
                      <span>MercadoPago está procesando tu pago</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-3 text-yellow-400" />
                      <span>Te avisaremos cuando esté confirmado</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 mr-3 text-yellow-400" />
                      <span>Puedes verificar el estado cuando quieras</span>
                    </div>
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 mr-3 text-yellow-400" />
                      <span>Contacta soporte si tienes dudas</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Mail, Ticket, ArrowLeft, QrCode, Loader, AlertCircle } from 'lucide-react';
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
  const [sendingEmail, setSendingEmail] = useState(false);

  const paymentReference = searchParams.get('ref') || sessionStorage.getItem('paymentReference');
  const paymentData = sessionStorage.getItem('paymentData');
  const parsedPaymentData = paymentData ? JSON.parse(paymentData) : null;

  useEffect(() => {
    if (!paymentReference) {
      navigate('/events');
      return;
    }

    checkPaymentStatus();
  }, [paymentReference]);

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
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'text-green-600';
      case 'pending':
      case 'in_process':
        return 'text-yellow-600';
      case 'rejected':
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verificando tu pago...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras confirmamos tu transacción
          </p>
        </div>
      </div>
    );
  }

  if (error || !paymentStatus) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Error al Verificar el Pago
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {error || 'No se pudo verificar el estado de tu pago'}
            </p>
            
            <div className="space-x-4">
              <button
                onClick={checkPaymentStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={handleGoToEvents}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Volver a Eventos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPaymentSuccessful = paymentStatus.preference.status === 'completed' || 
                             (paymentStatus.payment && paymentStatus.payment.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Status Header */}
        <div className="text-center mb-12">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isPaymentSuccessful ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {isPaymentSuccessful ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPaymentSuccessful ? '¡Pago Exitoso!' : 'Pago Pendiente'}
          </h1>
          <p className="text-xl text-gray-600">
            {isPaymentSuccessful 
              ? 'Tu compra ha sido procesada correctamente' 
              : 'Tu pago está siendo procesado'
            }
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Detalles del Pago
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Información del Pago</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Referencia:</span>
                  <span className="font-mono">{paymentStatus.preference.external_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-semibold ${getStatusColor(paymentStatus.preference.status)}`}>
                    {getStatusText(paymentStatus.preference.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">
                    {formatPrice(paymentStatus.preference.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span>{new Date(paymentStatus.preference.created_at).toLocaleString('es-ES')}</span>
                </div>
              </div>
            </div>

            {paymentStatus.payment && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Estado del Pago</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado MercadoPago:</span>
                    <span className={`font-semibold ${getStatusColor(paymentStatus.payment.status)}`}>
                      {getStatusText(paymentStatus.payment.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Detalle:</span>
                    <span>{paymentStatus.payment.status_detail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-semibold">
                      {formatPrice(paymentStatus.payment.transaction_amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Details (if available) */}
        {parsedPaymentData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Detalles del Evento
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {parsedPaymentData.event.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                  <div>
                    <strong>Fecha:</strong> {formatDate(parsedPaymentData.event.date)}
                  </div>
                  <div>
                    <strong>Ubicación:</strong> {parsedPaymentData.event.location}
                  </div>
                  <div>
                    <strong>Cantidad de entradas:</strong> {parsedPaymentData.quantity}
                  </div>
                  <div>
                    <strong>Precio por entrada:</strong> {formatPrice(parsedPaymentData.event.price)}
                  </div>
                </div>
              </div>

              {parsedPaymentData.attendees && parsedPaymentData.attendees.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Asistentes:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsedPaymentData.attendees.map((attendee: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="font-medium">{attendee.name}</div>
                        <div className="text-sm text-gray-600">{attendee.email}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isPaymentSuccessful && (
            <button
              onClick={handleGoToTickets}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              <Ticket className="w-5 h-5 mr-2" />
              Ver Mis Entradas
            </button>
          )}
          
          <button
            onClick={handleGoToEvents}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a Eventos
          </button>
        </div>

        {/* Information */}
        {isPaymentSuccessful && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              ¡Tu compra fue exitosa!
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li>• Tus entradas han sido generadas con códigos QR únicos</li>
              <li>• Puedes ver tus entradas en la sección "Mis Entradas"</li>
              <li>• Lleva tu código QR al evento (puedes mostrarlo en tu teléfono)</li>
              <li>• Si necesitas ayuda, contacta con soporte</li>
            </ul>
          </div>
        )}

        {!isPaymentSuccessful && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">
              Pago en Proceso
            </h3>
            <ul className="space-y-2 text-yellow-800">
              <li>• Tu pago está siendo procesado por MercadoPago</li>
              <li>• Recibirás una confirmación cuando se complete</li>
              <li>• Puedes verificar el estado en cualquier momento</li>
              <li>• Si tienes dudas, contacta con soporte</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-xl text-gray-600">
            Tu compra ha sido procesada correctamente
          </p>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Detalles de la Compra
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
                    <span>{tickets.length} entrada{tickets.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-20">Total:</span>
                    <span className="font-semibold text-primary-600">{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  <p><strong>ID de Pago:</strong> {paymentIntentId}</p>
                  <p><strong>Estado:</strong> <span className="text-green-600">Completado</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Tus Entradas
            </h2>
            
            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <div key={ticket.ticketCode} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Entrada {index + 1}
                    </h4>
                    <span className="text-sm text-gray-500 font-mono">
                      {ticket.ticketCode.slice(0, 8)}...
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {qrCodes[ticket.ticketCode] ? (
                      <div className="text-center">
                        <img 
                          src={qrCodes[ticket.ticketCode]} 
                          alt="QR Code" 
                          className="mx-auto w-32 h-32"
                        />
                        <button
                          onClick={() => handleDownloadQR(ticket.ticketCode, qrCodes[ticket.ticketCode])}
                          className="mt-2 text-sm text-primary-600 hover:text-primary-500 flex items-center mx-auto"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar QR
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateQR(ticket.ticketCode)}
                        className="w-full btn-secondary flex items-center justify-center"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Generar Código QR
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="card hover:shadow-lg transition-shadow duration-200 text-center"
          >
            <Mail className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">
              {sendingEmail ? 'Enviando...' : 'Enviar por Email'}
            </h3>
            <p className="text-sm text-gray-600">
              Recibe tus entradas en tu correo electrónico
            </p>
          </button>

          <button
            onClick={() => navigate('/my-tickets')}
            className="card hover:shadow-lg transition-shadow duration-200 text-center"
          >
            <Ticket className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">
              Mis Entradas
            </h3>
            <p className="text-sm text-gray-600">
              Ver todas tus entradas en tu perfil
            </p>
          </button>

          <button
            onClick={() => navigate('/events')}
            className="card hover:shadow-lg transition-shadow duration-200 text-center"
          >
            <ArrowLeft className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">
              Ver Más Eventos
            </h3>
            <p className="text-sm text-gray-600">
              Descubre otros eventos disponibles
            </p>
          </button>
        </div>

        {/* Important Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información Importante
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Para el Evento:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Llega 15 minutos antes del inicio</li>
                <li>• Trae tu código QR (puedes mostrarlo en tu teléfono)</li>
                <li>• Este código es único y no transferible</li>
                <li>• En caso de problemas, contacta con soporte</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recibo:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Se ha enviado un recibo a tu email</li>
                <li>• Guarda este recibo para tu referencia</li>
                <li>• El ID de pago es: {paymentIntentId}</li>
                <li>• Para reembolsos, contacta con soporte</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;

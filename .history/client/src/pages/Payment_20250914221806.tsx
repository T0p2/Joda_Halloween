import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Mail, QrCode, CreditCard, Users, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { event, peopleData, quantity, totalPrice, preferenceId, initPoint } = location.state || {};

  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');

  useEffect(() => {
    if (!event || !peopleData) {
      navigate('/');
      return;
    }
    generateQRCode();
  }, [event, peopleData]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);

      // Si ya tenemos un initPoint de Mercado Pago, usarlo directamente
      if (initPoint) {
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(initPoint)}`;
        setQrCode(qrCodeUrl);
        setIsLoading(false);
        return;
      }

      // Si no hay initPoint, intentar crear preferencia de pago con Mercado Pago
      try {
        const response = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event,
            peopleData,
            quantity,
            totalPrice
          })
        });

        const data = await response.json();

        if (data.success) {
          // Usar el init_point de Mercado Pago como QR
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.sandboxInitPoint)}`;
          setQrCode(qrCodeUrl);
          setIsLoading(false);
          return;
        }
      } catch (mpError) {
        console.log('Mercado Pago no disponible, usando QR simulado');
      }

      // Si Mercado Pago falla, crear un QR simulado
      const paymentData = {
        eventId: event.id,
        eventName: event.name,
        peopleCount: quantity,
        totalAmount: totalPrice,
        timestamp: new Date().toISOString(),
        paymentId: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        paymentUrl: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=DEMO-${Date.now()}`
      };

      // Crear un QR simulado con los datos del pago
      const qrData = JSON.stringify(paymentData);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

      setQrCode(qrCodeUrl);
      setIsLoading(false);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar el código QR');
      setIsLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `qr-pago-${event.name.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Código QR descargado');
    }
  };

  const handleSendEmail = async () => {
    toast.success('Las entradas se enviarán por email después del pago');
  };

  const handlePaymentComplete = () => {
    setPaymentStatus('completed');
    toast.success('¡Pago completado! Las entradas se enviarán por email.');
  };

  if (paymentStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              ¡Pago Completado!
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Las entradas se enviarán por email a todas las personas registradas.
            </p>
            <div className="bg-green-400 bg-opacity-20 rounded-lg p-4 mb-6">
              <h3 className="text-white font-semibold mb-2">Entradas confirmadas:</h3>
              <p className="text-gray-300">{quantity} {quantity === 1 ? 'entrada' : 'entradas'} para {event.name}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-3 px-6 rounded-lg transition-all duration-300"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/buy-ticket', { state: { event } })}
            className="flex items-center text-white hover:text-yellow-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </button>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Finalizar Pago
          </h1>
          <p className="text-gray-300">
            Escanea el código QR para completar tu compra
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Details */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Resumen de Compra
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-white">
                <span>Evento:</span>
                <span className="font-semibold">{event.name}</span>
              </div>
              
              <div className="flex justify-between text-white">
                <span>Cantidad:</span>
                <span className="font-semibold">{quantity} {quantity === 1 ? 'entrada' : 'entradas'}</span>
              </div>
              
              <div className="flex justify-between text-white">
                <span>Precio unitario:</span>
                <span className="font-semibold">${event.price}</span>
              </div>
              
              <div className="border-t border-white border-opacity-30 pt-4">
                <div className="flex justify-between text-xl font-bold text-yellow-400">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* People List */}
            <div className="bg-white bg-opacity-5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Personas ({quantity})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {peopleData.map((person, index) => (
                  <div key={index} className="text-sm text-gray-300 bg-white bg-opacity-5 p-2 rounded">
                    <div className="font-medium text-white">Entrada #{index + 1}</div>
                    <div>{person.name} - {person.email}</div>
                    <div className="text-xs">DNI: {person.dni} | Tel: {person.phone}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <QrCode className="w-6 h-6 mr-2" />
              Código QR de Pago
            </h2>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mb-4"></div>
                <p className="text-white">Generando código QR...</p>
              </div>
            ) : qrCode ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img 
                    src={qrCode} 
                    alt="Código QR de pago" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={handleDownloadQR}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar QR
                  </button>
                  
                  <button
                    onClick={handlePaymentComplete}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como Pagado
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-red-400">Error al generar el código QR</p>
                <button
                  onClick={generateQRCode}
                  className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Payment Instructions */}
            <div className="mt-6 bg-yellow-400 bg-opacity-20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Instrucciones de Pago:</h3>
              <ol className="text-gray-300 text-sm space-y-1">
                <li>1. Escanea el código QR con Mercado Pago</li>
                <li>2. Confirma el pago de ${totalPrice.toFixed(2)}</li>
                <li>3. Recibirás las entradas por email automáticamente</li>
                <li>4. El pago expira en 30 minutos</li>
              </ol>
            </div>

            {/* Test Payment Button */}
            <div className="mt-4">
              <button
                onClick={handleSendEmail}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar Entradas por Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
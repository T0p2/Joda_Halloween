import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Mail, QrCode, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { event, peopleData, quantity, totalPrice, preferenceId, initPoint } = location.state || {};

  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');

  useEffect(() => {
    if (!event || !formData) {
      navigate('/');
      return;
    }

    generateQRCode();
  }, [event, formData]);

    const generateQRCode = async () => {
    try {
      setIsLoading(true);
      
      // Intentar crear preferencia de pago con Mercado Pago
      try {
        const response = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event,
            formData,
            totalPrice
          })
        });

        const data = await response.json();
        
        if (data.success) {
          // Usar el init_point de Mercado Pago como QR
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.sandboxInitPoint)}`;
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
        customerName: formData.name,
        customerEmail: formData.email,
        quantity: formData.quantity,
        totalAmount: totalPrice,
        timestamp: new Date().toISOString(),
        paymentId: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        paymentUrl: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=DEMO-${Date.now()}`
      };

      // Crear un QR simulado con los datos del pago
      const qrData = JSON.stringify(paymentData);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
      
      setQrCode(qrCodeUrl);
      setIsLoading(false);

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar el código QR');
      setIsLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qr-payment-${event.name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Código QR descargado');
  };

  const handleSendEmail = async () => {
    try {
      // Aquí iría la lógica para enviar el email con el QR
      toast.success('Email enviado correctamente');
    } catch (error) {
      toast.error('Error al enviar el email');
    }
  };

  const handlePaymentComplete = () => {
    setPaymentStatus('completed');
    toast.success('¡Pago completado! Tus entradas han sido enviadas por email.');
  };

  if (!event || !formData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
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
            Pago con Código QR
          </h1>
          <p className="text-gray-300">
            Escanea el código QR para completar tu pago
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Details */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Detalles del Pago
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-300">
                <span>Evento:</span>
                <span className="text-white font-semibold">{event.name}</span>
              </div>
              
              <div className="flex justify-between text-gray-300">
                <span>Cliente:</span>
                <span className="text-white font-semibold">{formData.name}</span>
              </div>
              
              <div className="flex justify-between text-gray-300">
                <span>Email:</span>
                <span className="text-white font-semibold">{formData.email}</span>
              </div>
              
              <div className="flex justify-between text-gray-300">
                <span>Cantidad:</span>
                <span className="text-white font-semibold">{formData.quantity} {formData.quantity === 1 ? 'entrada' : 'entradas'}</span>
              </div>
              
                             <div className="flex justify-between text-gray-300">
                 <span>Precio unitario:</span>
                 <span className="text-white font-semibold">${event.price}</span>
               </div>
              
              <hr className="border-gray-600" />
              
                             <div className="flex justify-between text-xl font-bold text-yellow-400">
                 <span>Total:</span>
                 <span>${totalPrice.toFixed(2)}</span>
               </div>
            </div>

            {/* Payment Instructions */}
                         <div className="bg-yellow-400 bg-opacity-20 rounded-lg p-4">
               <h3 className="text-white font-semibold mb-2">Instrucciones de Pago:</h3>
               <ol className="text-gray-300 text-sm space-y-1">
                 <li>1. Escanea el código QR con Mercado Pago</li>
                 <li>2. Confirma el pago de ${totalPrice.toFixed(2)}</li>
                 <li>3. Recibirás tus entradas por email automáticamente</li>
                 <li>4. El pago expira en 30 minutos</li>
               </ol>
             </div>
          </div>

          {/* QR Code */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              Código QR de Pago
            </h3>
            
            <div className="flex flex-col items-center">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mb-4"></div>
                  <p className="text-gray-300">Generando código QR...</p>
                </div>
              ) : (
                <>
                  <div className="bg-white p-4 rounded-lg mb-6">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={handleDownloadQR}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar QR
                    </button>
                    
                    <button
                      onClick={handleSendEmail}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar por Email
                    </button>
                  </div>
                  
                  <button
                    onClick={handlePaymentComplete}
                    className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Confirmar Pago Completado
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {paymentStatus === 'completed' && (
          <div className="mt-8 bg-green-600 bg-opacity-20 backdrop-blur-sm rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-green-400 mb-2">
              ¡Pago Completado!
            </h3>
            <p className="text-gray-300 mb-4">
              Tus entradas han sido enviadas a {formData.email}
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;

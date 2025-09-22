import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AttendeeForm from '../components/AttendeeForm';

const BuyTicket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const event = location.state?.event;

  const [quantity, setQuantity] = useState(1);
  const [attendees, setAttendees] = useState([
    { name: '', email: '', dni: '', phone: '' }
  ]);
  const [errors, setErrors] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!event) {
    navigate('/');
    return null;
  }

  const totalPrice = event.price * quantity;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuantity = parseInt(e.target.value);
    setQuantity(newQuantity);
    
    // Ajustar el array de attendees según la cantidad
    if (newQuantity > attendees.length) {
      // Agregar attendees vacíos
      const newAttendees = [...attendees];
      for (let i = attendees.length; i < newQuantity; i++) {
        newAttendees.push({ name: '', email: '', dni: '', phone: '' });
      }
      setAttendees(newAttendees);
    } else if (newQuantity < attendees.length) {
      // Remover attendees extra
      setAttendees(attendees.slice(0, newQuantity));
    }
  };

  const handleAttendeeChange = (index: number, data: any) => {
    const newAttendees = [...attendees];
    newAttendees[index] = data;
    setAttendees(newAttendees);
    
    // Limpiar errores para este attendee
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<number, any> = {};
    let isValid = true;

    attendees.forEach((attendee, index) => {
      const attendeeErrors: any = {};
      
      if (!attendee.name.trim()) {
        attendeeErrors.name = 'El nombre es obligatorio';
        isValid = false;
      }
      
      if (!attendee.email.trim()) {
        attendeeErrors.email = 'El email es obligatorio';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(attendee.email)) {
        attendeeErrors.email = 'El email no es válido';
        isValid = false;
      }
      
      if (!attendee.dni.trim()) {
        attendeeErrors.dni = 'El DNI es obligatorio';
        isValid = false;
      }
      
      if (!attendee.phone.trim()) {
        attendeeErrors.phone = 'El teléfono es obligatorio';
        isValid = false;
      }

      if (Object.keys(attendeeErrors).length > 0) {
        newErrors[index] = attendeeErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsLoading(true);

    try {
      // Aquí iría la lógica para crear el pago
      // Por ahora simulamos un delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navegar a la página de pago con los datos
      navigate('/payment', { 
        state: { 
          event, 
          formData,
          totalPrice 
        } 
      });
    } catch (error) {
      toast.error('Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-white hover:text-yellow-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </button>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            Comprar Entrada
          </h1>
          <p className="text-gray-300">
            Completa tus datos para continuar con la compra
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Details */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              {event.name}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <Calendar className="w-5 h-5 mr-3 text-yellow-400" />
                <span>{event.date} - {event.time}</span>
              </div>
              
              <div className="flex items-center text-gray-300">
                <MapPin className="w-5 h-5 mr-3 text-yellow-400" />
                <span>{event.location}</span>
              </div>
              
                             <div className="flex items-center text-gray-300">
                 <Users className="w-5 h-5 mr-3 text-yellow-400" />
                 <span>${event.price} por entrada</span>
               </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-400 bg-opacity-20 rounded-lg">
                             <div className="flex justify-between items-center text-white">
                 <span className="font-semibold">Total:</span>
                 <span className="text-2xl font-bold text-yellow-400">
                   ${totalPrice.toFixed(2)}
                 </span>
               </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              Datos de Compra
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Cantidad de entradas
                </label>
                <select
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleQuantityChange}
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num} className="bg-gray-800">
                      {num} {num === 1 ? 'entrada' : 'entradas'}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Continuar al Pago
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-sm text-gray-300">
              <p>* Campos obligatorios</p>
              <p className="mt-2">
                Al continuar, aceptas nuestros términos y condiciones de compra.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyTicket;

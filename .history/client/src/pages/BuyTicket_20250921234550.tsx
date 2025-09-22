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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

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
    
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos obligatorios correctamente');
      return;
    }

    setIsLoading(true);

    try {
      // Navegar a la página de pago con los datos
      navigate('/payment', { 
        state: { 
          event, 
          attendees,
          quantity,
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-6 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-white hover:text-yellow-400 transition-colors mb-4 bg-black bg-opacity-30 px-4 py-2 rounded-lg backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </button>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            🎫 Comprar Entrada Halloween
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            Completa tus datos para unirte a la fiesta más terrorífica 👻
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Event Details */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-orange-400 border-opacity-30">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center">
              🎃 {event.name}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center text-gray-300 text-sm sm:text-base">
                <Calendar className="w-5 h-5 mr-3 text-yellow-400 flex-shrink-0" />
                <span>{event.date} - {event.time}</span>
              </div>
              
              <div className="flex items-center text-gray-300 text-sm sm:text-base">
                <MapPin className="w-5 h-5 mr-3 text-yellow-400 flex-shrink-0" />
                <span>{event.location}</span>
              </div>
              
              <div className="flex items-center text-gray-300 text-sm sm:text-base">
                <Users className="w-5 h-5 mr-3 text-yellow-400 flex-shrink-0" />
                <span>${event.price} por entrada</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-orange-400 to-red-500 bg-opacity-20 rounded-lg border border-orange-400">
              <div className="flex justify-between items-center text-white">
                <span className="font-semibold text-sm sm:text-base">👻 Total a pagar:</span>
                <span className="text-xl sm:text-2xl font-bold text-yellow-400">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-purple-400 border-opacity-30">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-6 flex items-center">
                🎫 Configuración de Entradas
              </h3>

              <div>
                <label className="block text-white font-medium mb-2 text-sm sm:text-base">
                  Cantidad de entradas
                </label>
                <select
                  name="quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num} className="bg-gray-800">
                      {num} {num === 1 ? 'entrada' : 'entradas'}
                    </option>
                  ))}
                </select>
                <p className="text-gray-300 text-xs sm:text-sm mt-2">
                  Cada entrada debe tener los datos completos de una persona diferente 👤
                </p>
              </div>
            </div>

            {/* Formularios de cada persona */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {attendees.map((attendee, index) => (
                <AttendeeForm
                  key={index}
                  attendeeNumber={index + 1}
                  data={attendee}
                  onChange={(data) => handleAttendeeChange(index, data)}
                  errors={errors[index]}
                />
              ))}

              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-3 sm:py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Procesando... 👻
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      🎃 Continuar al Pago (${totalPrice.toFixed(2)})
                    </>
                  )}
                </button>

                <div className="mt-6 text-xs sm:text-sm text-gray-300 text-center">
                  <p>* Campos obligatorios</p>
                  <p className="mt-2">
                    🦇 Al continuar, aceptas unirte a la fiesta más terrorífica del año.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyTicket;

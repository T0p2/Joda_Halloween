import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PersonData {
  name: string;
  email: string;
  phone: string;
  dni: string;
}

const BuyTicket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const event = location.state?.event;

  const [quantity, setQuantity] = useState(1);
  const [peopleData, setPeopleData] = useState<PersonData[]>([
    { name: '', email: '', phone: '', dni: '' }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  if (!event) {
    navigate('/');
    return null;
  }

  const totalPrice = event.price * quantity;

  // Función para actualizar la cantidad y ajustar el array de personas
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newQuantity = parseInt(e.target.value);
    setQuantity(newQuantity);

    // Ajustar el array de personas según la nueva cantidad
    setPeopleData(prev => {
      const newPeopleData = [...prev];
      
      if (newQuantity > prev.length) {
        // Agregar personas vacías si aumentó la cantidad
        for (let i = prev.length; i < newQuantity; i++) {
          newPeopleData.push({ name: '', email: '', phone: '', dni: '' });
        }
      } else if (newQuantity < prev.length) {
        // Remover personas si disminuyó la cantidad
        newPeopleData.splice(newQuantity);
      }
      
      return newPeopleData;
    });
  };

  // Función para actualizar datos de una persona específica
  const handlePersonDataChange = (index: number, field: keyof PersonData, value: string) => {
    setPeopleData(prev => prev.map((person, i) => 
      i === index ? { ...person, [field]: value } : person
    ));
  };

  // Función para validar datos únicos
  const validateUniqueData = () => {
    const emails = peopleData.map(person => person.email.toLowerCase().trim()).filter(email => email);
    const phones = peopleData.map(person => person.phone.trim()).filter(phone => phone);
    const dnis = peopleData.map(person => person.dni.trim()).filter(dni => dni);

    // Verificar emails duplicados
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicateEmails.length > 0) {
      toast.error(`Emails duplicados: ${duplicateEmails.join(', ')}`);
      return false;
    }

    // Verificar teléfonos duplicados
    const duplicatePhones = phones.filter((phone, index) => phones.indexOf(phone) !== index);
    if (duplicatePhones.length > 0) {
      toast.error(`Teléfonos duplicados: ${duplicatePhones.join(', ')}`);
      return false;
    }

    // Verificar DNI duplicados
    const duplicateDnis = dnis.filter((dni, index) => dnis.indexOf(dni) !== index);
    if (duplicateDnis.length > 0) {
      toast.error(`DNI duplicados: ${duplicateDnis.join(', ')}`);
      return false;
    }

    return true;
  };

  // Función para validar que todos los campos obligatorios estén completos
  const validateRequiredFields = () => {
    for (let i = 0; i < peopleData.length; i++) {
      const person = peopleData[i];
      if (!person.name.trim() || !person.email.trim() || !person.phone.trim() || !person.dni.trim()) {
        toast.error(`Por favor completa todos los campos de la persona ${i + 1}`);
        return false;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(person.email)) {
        toast.error(`Email inválido para la persona ${i + 1}`);
        return false;
      }

      // Validar formato de DNI (8 dígitos)
      const dniRegex = /^\d{8}$/;
      if (!dniRegex.test(person.dni)) {
        toast.error(`DNI debe tener 8 dígitos para la persona ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRequiredFields() || !validateUniqueData()) {
      return;
    }

    setIsLoading(true);

    try {
      // Enviar datos al backend para guardar en CSV y crear preferencia de pago
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
        // Navegar a la página de pago con los datos
        navigate('/payment', { 
          state: { 
            event, 
            peopleData,
            quantity,
            totalPrice,
            preferenceId: data.preferenceId,
            initPoint: data.initPoint
          } 
        });
      } else {
        toast.error(data.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
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
            Comprar Entradas
          </h1>
          <p className="text-gray-300">
            Completa los datos de todas las personas para continuar con la compra
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          <div className="lg:col-span-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              Datos de las Personas
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selector de cantidad */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Cantidad de entradas
                </label>
                <select
                  value={quantity}
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

              {/* Formularios para cada persona */}
              <div className="space-y-6">
                {peopleData.map((person, index) => (
                  <div key={index} className="bg-white bg-opacity-5 rounded-lg p-4 border border-white border-opacity-20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">
                        Persona {index + 1}
                      </h4>
                      {quantity > 1 && (
                        <div className="text-sm text-gray-300">
                          Entrada #{index + 1}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Nombre completo *
                        </label>
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => handlePersonDataChange(index, 'name', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          placeholder="Nombre completo"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          DNI *
                        </label>
                        <input
                          type="text"
                          value={person.dni}
                          onChange={(e) => handlePersonDataChange(index, 'dni', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          placeholder="12345678"
                          maxLength={8}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={person.email}
                          onChange={(e) => handlePersonDataChange(index, 'email', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          placeholder="persona@email.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          value={person.phone}
                          onChange={(e) => handlePersonDataChange(index, 'phone', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          placeholder="+54 11 1234-5678"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                    Continuar al Pago (${totalPrice.toFixed(2)})
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-sm text-gray-300">
              <p>* Campos obligatorios</p>
              <p className="mt-2">
                Al continuar, aceptas nuestros términos y condiciones de compra.
              </p>
              <p className="mt-2 text-yellow-400">
                Todos los datos deben ser únicos (no se permiten emails, teléfonos o DNI duplicados).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyTicket;
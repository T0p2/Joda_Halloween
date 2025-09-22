import React from 'react';
import { User, Mail, CreditCard, Phone } from 'lucide-react';

interface AttendeeData {
  name: string;
  email: string;
  dni: string;
  phone: string;
}

interface AttendeeFormProps {
  attendeeNumber: number;
  data: AttendeeData;
  onChange: (data: AttendeeData) => void;
  errors?: Partial<AttendeeData>;
}

const AttendeeForm: React.FC<AttendeeFormProps> = ({
  attendeeNumber,
  data,
  onChange,
  errors = {}
}) => {
  const handleInputChange = (field: keyof AttendeeData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
        <User className="w-5 h-5 mr-2 text-yellow-400" />
        Persona {attendeeNumber}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="md:col-span-2">
          <label className="block text-white font-medium mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Nombre completo *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
              errors.name ? 'border-red-400' : ''
            }`}
            placeholder="Nombre completo de la persona"
            required
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-white font-medium mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
              errors.email ? 'border-red-400' : ''
            }`}
            placeholder="email@ejemplo.com"
            required
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* DNI */}
        <div>
          <label className="block text-white font-medium mb-2">
            <CreditCard className="w-4 h-4 inline mr-1" />
            DNI *
          </label>
          <input
            type="text"
            value={data.dni}
            onChange={(e) => handleInputChange('dni', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
              errors.dni ? 'border-red-400' : ''
            }`}
            placeholder="12345678A"
            required
          />
          {errors.dni && (
            <p className="text-red-400 text-sm mt-1">{errors.dni}</p>
          )}
        </div>

        {/* Teléfono */}
        <div className="md:col-span-2">
          <label className="block text-white font-medium mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Teléfono *
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
              errors.phone ? 'border-red-400' : ''
            }`}
            placeholder="+34 600 000 000"
            required
          />
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendeeForm;

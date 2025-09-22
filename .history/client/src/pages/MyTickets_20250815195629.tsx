import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Ticket, QrCode, Download, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Ticket {
  id: number;
  ticket_code: string;
  status: string;
  amount_paid: number;
  created_at: string;
  event_name: string;
  event_date: string;
  event_location: string;
  image_url: string;
  qr_code?: string;
}

const MyTickets: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const response = await axios.get('/api/tickets/my-tickets');
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Error al cargar las entradas');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (ticketCode: string) => {
    try {
      const response = await axios.get(`/api/tickets/qr/${ticketCode}`);
      setQrCodes(prev => ({
        ...prev,
        [ticketCode]: response.data.qrCode
      }));
    } catch (error) {
      toast.error('Error al generar el código QR');
    }
  };

  const handleDownloadQR = (ticketCode: string, qrCode: string) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `ticket-${ticketCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendEmail = async (ticketId: number) => {
    setSendingEmail(true);

    try {
      await axios.post('/api/email/send-ticket', {
        ticketId: ticketId,
        email: user?.email || ''
      });

      toast.success('¡Entrada enviada por email!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar el email');
    } finally {
      setSendingEmail(false);
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
      currency: 'EUR'
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'used':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Ticket className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'used':
        return 'Usada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'used':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mis Entradas
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Aquí puedes ver todas tus entradas compradas, generar códigos QR y enviarlas por email.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {tickets.length}
            </div>
            <div className="text-gray-600">Total de Entradas</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {tickets.filter(t => t.status === 'active').length}
            </div>
            <div className="text-gray-600">Entradas Activas</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {tickets.filter(t => t.status === 'used').length}
            </div>
            <div className="text-gray-600">Entradas Usadas</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-gray-600 mb-2">
              {formatPrice(tickets.reduce((sum, t) => sum + t.amount_paid, 0))}
            </div>
            <div className="text-gray-600">Total Gastado</div>
          </div>
        </div>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Ticket className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes entradas
            </h3>
            <p className="text-gray-600 mb-6">
              Compra tu primera entrada para verla aquí.
            </p>
            <button
              onClick={() => window.location.href = '/events'}
              className="btn-primary"
            >
              Ver Eventos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="card hover:shadow-lg transition-shadow duration-300">
                {/* Event Image */}
                <div className="relative mb-4">
                  <img
                    src={ticket.image_url}
                    alt={ticket.event_name}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';
                    }}
                  />
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(ticket.status)}`}>
                    <div className="flex items-center">
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1">{getStatusText(ticket.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Info */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {ticket.event_name}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">{formatDate(ticket.event_date)}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{ticket.event_location}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <span className="text-sm font-mono">
                        {ticket.ticket_code.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="space-y-3">
                    {qrCodes[ticket.ticket_code] ? (
                      <div className="text-center">
                        <img 
                          src={qrCodes[ticket.ticket_code]} 
                          alt="QR Code" 
                          className="mx-auto w-24 h-24"
                        />
                        <button
                          onClick={() => handleDownloadQR(ticket.ticket_code, qrCodes[ticket.ticket_code])}
                          className="mt-2 text-sm text-primary-600 hover:text-primary-500 flex items-center mx-auto"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateQR(ticket.ticket_code)}
                        className="w-full btn-secondary flex items-center justify-center"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Generar QR
                      </button>
                    )}

                    {/* Email Button */}
                    <button
                      onClick={() => handleSendEmail(ticket.id)}
                      disabled={sendingEmail}
                      className="w-full btn-primary flex items-center justify-center"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {sendingEmail ? 'Enviando...' : 'Enviar por Email'}
                    </button>
                  </div>

                  {/* Price */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Precio:</span>
                      <span className="font-semibold text-primary-600">
                        {formatPrice(ticket.amount_paid)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;

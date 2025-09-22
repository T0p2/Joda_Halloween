import React, { useState, useEffect } from 'react';
import { Download, Users, Calendar, DollarSign, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  price: number;
  total_tickets: number;
  available_tickets: number;
}

interface EventStats {
  eventId: number;
  eventName: string;
  ticketsSold: number;
  totalRevenue: number;
  ticketsActive: number;
  ticketsUsed: number;
}

const Admin: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<{ [key: number]: boolean }>({});
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsResponse, statsResponse] = await Promise.all([
        axios.get('/api/tickets/events'),
        axios.get('/api/tickets/stats')
      ]);

      setEvents(eventsResponse.data.events);
      setStats(statsResponse.data.stats || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleExportEvent = async (eventId: number, eventName: string) => {
    setExporting(prev => ({ ...prev, [eventId]: true }));

    try {
      const response = await axios.get(`/api/export/event/${eventId}/excel`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `asistentes_${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('¡Archivo Excel exportado exitosamente!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar el archivo');
    } finally {
      setExporting(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleExportAll = async () => {
    setExportingAll(true);

    try {
      const response = await axios.get('/api/export/all-events/excel', {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `todos_los_eventos_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('¡Archivo Excel con todos los eventos exportado exitosamente!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar el archivo');
    } finally {
      setExportingAll(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona eventos y exporta datos de asistentes
          </p>
        </div>

        {/* Export All Button */}
        <div className="mb-8">
          <button
            onClick={handleExportAll}
            disabled={exportingAll}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center"
          >
            {exportingAll ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Exportando...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Exportar Todos los Eventos a Excel
              </>
            )}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Descarga un archivo Excel con todos los asistentes de todos los eventos
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventStats = stats.find(s => s.eventId === event.id);
            const isExporting = exporting[event.id] || false;

            return (
              <div key={event.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {event.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>{formatPrice(event.price)} por entrada</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                {eventStats && (
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {eventStats.ticketsSold}
                      </div>
                      <div className="text-sm text-blue-800">Entradas Vendidas</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(eventStats.totalRevenue)}
                      </div>
                      <div className="text-sm text-green-800">Recaudado</div>
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <button
                  onClick={() => handleExportEvent(event.id, event.name)}
                  disabled={isExporting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Asistentes
                    </>
                  )}
                </button>

                {/* Event Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total entradas:</span>
                    <span>{event.total_tickets}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Disponibles:</span>
                    <span>{event.available_tickets}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay eventos disponibles
            </h3>
            <p className="text-gray-600">
              Crea algunos eventos para comenzar a vender entradas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

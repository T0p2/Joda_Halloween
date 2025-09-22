// Configuración de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    mercadopago: {
      createPreference: `${API_BASE_URL}/api/mercadopago/create-preference`,
      test: `${API_BASE_URL}/api/mercadopago/test`,
      config: `${API_BASE_URL}/api/mercadopago/config`,
      payment: (paymentId) => `${API_BASE_URL}/api/mercadopago/payment/${paymentId}`,
      paymentStatus: (reference) => `${API_BASE_URL}/api/mercadopago/payment-status/${reference}`
    },
    tickets: {
      events: `${API_BASE_URL}/api/tickets/events`,
      event: (id) => `${API_BASE_URL}/api/tickets/events/${id}`,
      create: `${API_BASE_URL}/api/tickets/create`,
      myTickets: `${API_BASE_URL}/api/tickets/my-tickets`,
      qr: (ticketCode) => `${API_BASE_URL}/api/tickets/qr/${ticketCode}`,
      validate: (ticketCode) => `${API_BASE_URL}/api/tickets/validate/${ticketCode}`,
      stats: `${API_BASE_URL}/api/tickets/stats`
    },
    auth: {
      register: `${API_BASE_URL}/api/auth/register`,
      login: `${API_BASE_URL}/api/auth/login`,
      profile: `${API_BASE_URL}/api/auth/profile`,
      verify: `${API_BASE_URL}/api/auth/verify`
    },
    email: {
      sendTickets: `${API_BASE_URL}/api/email/send-tickets`
    },
    export: {
      eventExcel: (eventId) => `${API_BASE_URL}/api/export/event/${eventId}/excel`,
      allEventsExcel: `${API_BASE_URL}/api/export/all-events/excel`
    }
  }
};

export default apiConfig;

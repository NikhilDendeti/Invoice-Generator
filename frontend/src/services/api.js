import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5002/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data; // Return only the data part of the response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = api;

// Invoice API
export const invoiceAPI = {
  // Get all invoices
  getInvoices: (params = {}) => api.get('/invoices', { params }),
  
  // Get single invoice
  getInvoice: (id) => api.get(`/invoices/${id}`),
  
  // Create invoice
  createInvoice: (data) => api.post('/invoices', data),
  
  // Update invoice
  updateInvoice: (id, data) => api.put(`/invoices/${id}`, data),
  
  // Update invoice status
  updateInvoiceStatus: (id, status) => api.put(`/invoices/${id}/status`, { status }),
  
  // Delete invoice
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),
  
  // Search invoices
  searchInvoices: (query) => api.get('/invoices/search', { params: { q: query } }),
  
  // Get invoice stats
  getInvoiceStats: (period = '30d') => api.get('/invoices/stats', { params: { period } }),
};

// PDF API
export const pdfAPI = {
  // Generate PDF
  generatePDF: (id, options = {}) => api.post(`/pdf/${id}/generate`, null, { params: options }),
  
  // Download PDF
  downloadPDF: (filename) => api.get(`/pdf/download/${filename}`, { responseType: 'blob' }),
  
  // Get PDF info
  getPDFInfo: (id) => api.get(`/pdf/${id}/info`),
  
  // Delete PDF
  deletePDF: (id, pdfId) => api.delete(`/pdf/${id}/delete`, { data: { pdfId } }),
  
  // Email PDF
  emailPDF: (id, data) => api.post(`/pdf/${id}/email`, data),
  
  // PDF Library Management
  getPdfLibrary: (params = {}) => api.get('/pdf/library', { params }),
  getPdfStats: () => api.get('/pdf/library/stats'),
  bulkDeletePdfs: (pdfIds) => api.delete('/pdf/library/bulk', { data: { pdfIds } }),
  updatePdfSettings: (settings) => api.put('/pdf/settings', settings),
  cleanupExpiredPdfs: () => api.post('/pdf/cleanup'),
};

export default api;

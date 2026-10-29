import api from './api';

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats')
};

export const analyticsService = {
  getAnalytics: () => api.get('/analytics')
};

export const knowledgeService = {
  getDocuments: (params = {}) => api.get('/knowledge-base', { params }),
  getDocumentById: (id) => api.get(`/knowledge-base/${id}`)
};

export const customerService = {
  getCustomers: (params = {}) => api.get('/customers', { params }),
  getCustomerById: (id) => api.get(`/customers/${id}`)
};

export const orderService = {
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`)
};

export const settingsService = {
  getSettings: () => api.get('/settings')
};

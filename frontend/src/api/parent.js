import api from './client';

export const getDashboard = () => api.get('/api/parent/dashboard');
export const getProfile = () => api.get('/api/parent/profile');
export const updateProfile = (data) => api.put('/api/parent/profile', data);
export const getChildren = () => api.get('/api/parent/children');
export const getChildDetails = (id, params) =>
  api.get(`/api/parent/children/${id}`, { params });
export const getPaymentHistory = (params) =>
  api.get('/api/parent/payment-history', { params });
export const getChildPayments = (id) =>
  api.get(`/api/parent/children/${id}/payments`);
import api from './client';

export const loginAdmin = (email, password) => {
  return api.post('/login/admin', { email, password });
};

export const loginParent = (phone, password) => {
  return api.post('/login/parent', { phone, password });
};

export const logout = () => {
  return api.post('/logout');
};

export const refreshToken = (refreshToken) => {
  return api.post('/refresh', { refresh_token: refreshToken });
};

export const checkSetup = () => {
  return api.get('/setup/check');
};

export const createFirstAdmin = (data) => {
  return api.post('/setup/create-admin', data);
};
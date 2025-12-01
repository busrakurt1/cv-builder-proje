import api from './api';

export const authAPI = {
  // Giriş yap
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Kayıt ol
  register: (userData) => api.post('/auth/register', userData)
};
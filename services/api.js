// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Ana Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

// ================= REQUEST & RESPONSE INTERCEPTORS =================
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ================= AUTH API =================
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  healthCheck: () => api.get('/auth/health'),
};

// ================= USER API =================
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  checkEmail: (email) => api.get('/users/check-email', { params: { email } }),
  healthCheck: () => api.get('/users/health'),
};

// ================= PROFILE API - GÜNCELLENDİ =================
// Backend endpoint'ine göre düzeltildi: /api/profile/me
export const profileAPI = {
  // Profil getir
  getMe: () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id;
    return api.get('/profile/me', {
      headers: { 'X-USER-ID': userId },
    });
  },

  // Profil kaydet/güncelle
  updateMe: (data) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id;
    return api.put('/profile/me', data, {
      headers: { 'X-USER-ID': userId },
    });
  },
};

// ================= CV GENERATOR API - EKLENDİ =================
export const cvGeneratorAPI = {
  // CV oluştur
  generateCV: (userId, jobId) => {
    return api.post(`/cv-generator/create?userId=${userId}&jobId=${jobId}`);
  },
  
  // CV'leri listele
  getMyCVs: () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.id;
    return api.get(`/cv-generator/my-cvs`, {
      headers: { 'X-USER-ID': userId },
    });
  },
  
  // CV indir
  downloadCV: (cvId) => {
    return api.get(`/cv-generator/download/${cvId}`, {
      responseType: 'blob',
    });
  },
};

// ================= TEMPLATE API =================
export const templateAPI = {
  getAll: () => api.get('/templates'),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
};

// ================= ANALYSIS API =================
export const analysisAPI = {
  analyzeJobMatch: (data) => api.post('/analysis/job-match', data),
  getAnalysisHistory: (userId) => api.get(`/analysis/history/${userId}`),
  getAnalysisById: (id) => api.get(`/analysis/${id}`),
  healthCheck: () => api.get('/analysis/health'),
};

// ================= JOB POSTING ANALYSIS API =================
export const jobAPI = {
  analyzePosting: (userId, url) =>
    api.post(
      '/job/analyze',
      { url },
      { headers: { 'X-USER-ID': userId } }
    ),
};

// ================= GLOBAL HEALTHCHECK =================
export const healthAPI = {
  checkAll: async () => {
    const endpoints = [
      authAPI.healthCheck(),
      userAPI.healthCheck(),
      analysisAPI.healthCheck(),
    ];

    const results = await Promise.allSettled(endpoints);

    return results.map((res, i) => ({
      service: ['Auth', 'User', 'Analysis'][i],
      status: res.status === 'fulfilled' ? 'UP' : 'DOWN',
      data: res.status === 'fulfilled' ? res.value.data : res.reason.message,
    }));
  },
};

// ================= HELPER FUNCTIONS =================
export const handleApiError = (error) => {
  console.error('API Error:', error);

  const msg = error.response?.data?.message || error.message || 'Sunucuya ulaşılamadı';
  const status = error.response?.status;

  if (error.code === 'ERR_NETWORK' || status === 0) {
    return { success: false, message: 'Backend erişilemiyor.', status: 'NETWORK_ERROR' };
  }

  return { success: false, message: msg, status: status || 'UNKNOWN_ERROR' };
};

export const handleApiSuccess = (data, msg = 'İşlem başarılı') => ({
  success: true,
  data,
  message: msg,
  timestamp: new Date().toISOString(),
});

// ================= USER MANAGER =================
export const userManager = {
  setUser: (u) => localStorage.setItem('user', JSON.stringify(u)),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  removeUser: () => localStorage.removeItem('user'),
  isLoggedIn: () => !!localStorage.getItem('user'),
  getToken: () => userManager.getUser()?.token,
  getUserId: () => {
    const user = userManager.getUser();
    return user?.id || null;
  },
};

// ================= BACKEND TEST =================
export const testConnection = async () => {
  try {
    const res = await api.get('/health');
    return { connected: true, data: res.data };
  } catch (err) {
    return { connected: false, error: handleApiError(err) };
  }
};

export default api;
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Ana Axios Instance (withCredentials aktif)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10000,
});

// 📌 Request Interceptor - JWT Token ekleme
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 📌 Response Interceptor - 401 durumunda logout yap
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/* ===================== 🔥 AUTH API ===================== */
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  healthCheck: () => api.get('/auth/health'),
};

/* ===================== 🔥 USERS API ===================== */
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  checkEmail: (email) => api.get(`/users/check-email?email=${email}`),
  healthCheck: () => api.get('/users/health'),
};

/* ===================== 🔥 TEMPLATE API (Yeni eklendi) ===================== */
export const templateAPI = {
  getAllTemplates: () => api.get('/templates'),
  getTemplateById: (id) => api.get(`/templates/${id}`),
  createTemplate: (data) => api.post('/templates', data),
  updateTemplate: (id, data) => api.put(`/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
  healthCheck: () => api.get('/templates/health'),
};

/* ===================== 🔥 ANALYSIS API ===================== */
export const analysisAPI = {
  analyzeJobMatch: (data) => api.post('/analysis/job-match', data),
  getAnalysisHistory: (userId) => api.get(`/analysis/history/${userId}`),
  getAnalysisById: (id) => api.get(`/analysis/${id}`),
  healthCheck: () => api.get('/analysis/health'),
};

/* ===================== 🔥 GENEL HEALTH CHECK ===================== */
export const healthAPI = {
  checkAll: async () => {
    const endpoints = [
      authAPI.healthCheck(),
      userAPI.healthCheck(),
      templateAPI.healthCheck(),
      analysisAPI.healthCheck()
    ];

    const names = ["Auth", "Users", "Templates", "Analysis"];

    const results = await Promise.allSettled(endpoints);
    return results.map((r, i) => ({
      service: names[i],
      status: r.status === "fulfilled" ? "UP" : "DOWN",
      data: r.status === "fulfilled" ? r.value.data : r.reason.message
    }));
  }
};

/* ===================== 🔥 ERROR & SUCCESS HELPERS ===================== */
export const handleApiError = (error) => ({
  success: false,
  message: error.response?.data?.message || error.message,
  status: error.response?.status || "UNKNOWN",
  timestamp: new Date().toISOString()
});

export const handleApiSuccess = (data, message = "İşlem başarılı") => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

/* ===================== 🔥 USER STORAGE MANAGER ===================== */
export const userManager = {
  setUser: (user) => localStorage.setItem("user", JSON.stringify(user)),
  getUser: () => JSON.parse(localStorage.getItem("user") || 'null'),
  removeUser: () => localStorage.removeItem("user"),
  getToken: () => userManager.getUser()?.token,
  isLoggedIn: () => !!localStorage.getItem("user"),
};

/* ===================== 🔥 API STATUS TEST ===================== */
export const testConnection = async () => {
  try {
    const res = await api.get("/health");
    return { connected: true, data: res.data };
  } catch (err) {
    return { connected: false, error: handleApiError(err) };
  }
};

export default api;

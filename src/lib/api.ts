import axios, { AxiosError, AxiosInstance } from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
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
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    // Prefer JSON body (matches typical Swagger "Try it out" payload)
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (err) {
      const error = err as AxiosError;

      // Fallback for backends using OAuth2PasswordRequestForm (x-www-form-urlencoded)
      if (error.response?.status === 422) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return response.data;
      }

      throw err;
    }
  },
};

// Academic API
export const academicApi = {
  getYears: async () => {
    const response = await api.get('/academic/years');
    return response.data;
  },
  getSemesters: async (yearId: number) => {
    const response = await api.get(`/academic/semesters/${yearId}`);
    return response.data;
  },
  getSubjects: async (semesterId: number) => {
    const response = await api.get(`/academic/subjects/${semesterId}`);
    return response.data;
  },
  getUnits: async (subjectId: number) => {
    const response = await api.get(`/academic/units/${subjectId}`);
    return response.data;
  },
  getTopics: async (unitId: number) => {
    const response = await api.get(`/academic/topics/${unitId}`);
    return response.data;
  },
};

// Paper API
export const paperApi = {
  generate: async (payload: {
    subject_id: number;
    unit_ids?: number[];
    topic_ids?: number[];
    ai_engine: string;
    difficulty_distribution: { easy: number; medium: number; hard: number };
    total_marks?: number;
  }) => {
    const response = await api.post('/paper/generate', payload);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/paper/history');
    return response.data;
  },
  getPaper: async (paperId: number) => {
    const response = await api.get(`/paper/${paperId}`);
    return response.data;
  },
  downloadPdf: (paperId: number) => {
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}/paper/download/${paperId}`;
  },
};

// Analytics API
export const analyticsApi = {
  getPaperAnalytics: async (paperId: number) => {
    const response = await api.get(`/analytics/paper/${paperId}`);
    return response.data;
  },
};

export default api;

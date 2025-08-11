// API configuration and base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://task-manager-backend-gamma-silk.vercel.app/api';

// Debug logging
console.log('🔗 API Configuration:');
console.log('Environment Variable NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    profile: `${API_BASE_URL}/auth/profile`,
  },
  tasks: {
    base: `${API_BASE_URL}/tasks`,
    create: `${API_BASE_URL}/tasks`,
    update: (id: string) => `${API_BASE_URL}/tasks/${id}`,
    delete: (id: string) => `${API_BASE_URL}/tasks/${id}`,
    getById: (id: string) => `${API_BASE_URL}/tasks/${id}`,
  },
  health: `${API_BASE_URL}/health`,
};

export { API_BASE_URL };

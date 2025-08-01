import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from './api-config';
import { Task, User, CreateTaskData, StoredTaskStatus, TaskPriority } from './types';

// Types for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Create axios instance with default configuration
const axiosInstance = axios.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

class AxiosApiService {
  private async makeRequest<T>(
    requestConfig: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await axiosInstance(requestConfig);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        return {
          success: false,
          error: errorMessage,
        };
      }
      
      return {
        success: false,
        error: 'Unknown error occurred',
      };
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>({
      method: 'POST',
      url: API_ENDPOINTS.auth.login,
      data: { email, password },
    });
  }

  async register(name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>({
      method: 'POST',
      url: API_ENDPOINTS.auth.register,
      data: { name, email, password },
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'POST',
      url: API_ENDPOINTS.auth.logout,
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>({
      method: 'GET',
      url: API_ENDPOINTS.auth.profile,
    });
  }

  async updateProfile(userData: { name: string; email: string }): Promise<ApiResponse<User>> {
    return this.makeRequest<User>({
      method: 'PUT',
      url: API_ENDPOINTS.auth.profile,
      data: userData,
    });
  }

  // Task methods
  async getTasks(): Promise<ApiResponse<Task[]>> {
    return this.makeRequest<Task[]>({
      method: 'GET',
      url: API_ENDPOINTS.tasks.base,
    });
  }

  async createTask(taskData: CreateTaskData): Promise<ApiResponse<Task>> {
    return this.makeRequest<Task>({
      method: 'POST',
      url: API_ENDPOINTS.tasks.create,
      data: taskData,
    });
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.makeRequest<Task>({
      method: 'PUT',
      url: API_ENDPOINTS.tasks.update(id),
      data: taskData,
    });
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'DELETE',
      url: API_ENDPOINTS.tasks.delete(id),
    });
  }

  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    return this.makeRequest<Task>({
      method: 'GET',
      url: API_ENDPOINTS.tasks.getById(id),
    });
  }

  async getTaskStats(): Promise<ApiResponse<{
    total: number;
    pending: number;
    completed: number;
    overdue: number;
  }>> {
    return this.makeRequest({
      method: 'GET',
      url: `${API_ENDPOINTS.tasks.base}/stats`,
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest({
      method: 'GET',
      url: API_ENDPOINTS.health,
    });
  }
}

export const axiosApiService = new AxiosApiService();

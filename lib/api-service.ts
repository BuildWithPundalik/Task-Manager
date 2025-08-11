import { API_ENDPOINTS } from './api-config';
import { Task, User, CreateTaskData } from './types';

// Types for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Backend response types
interface TasksResponse {
  success: boolean;
  count?: number;
  tasks: Task[];
}

interface TaskResponse {
  success: boolean;
  task: Task;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class ApiService {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Invalid token format:', error);
      return true;
    }
  }

  private clearAuthData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if we're not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    
    // Check token validity before making request (except for login/register)
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');
    if (token && !isAuthRequest && this.isTokenExpired(token)) {
      console.log('Token expired, clearing auth data');
      this.clearAuthData();
      return {
        success: false,
        error: 'Session expired. Please login again.',
      };
    }

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token && !isAuthRequest) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration from server (but not for auth requests)
        if (response.status === 401 && !isAuthRequest) {
          console.log('Unauthorized request, clearing auth data');
          this.clearAuthData();
          return {
            success: false,
            error: 'Session expired. Please login again.',
          };
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      
      // Handle network errors that might indicate token issues (except for auth requests)
      if (error instanceof Error && error.message.includes('401') && !isAuthRequest) {
        this.clearAuthData();
        return {
          success: false,
          error: 'Session expired. Please login again.',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.makeRequest(API_ENDPOINTS.auth.logout, {
      method: 'POST',
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(API_ENDPOINTS.auth.profile);
  }

  async updateProfile(userData: { name: string; email: string }): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(API_ENDPOINTS.auth.profile, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Task methods
  async getTasks(): Promise<ApiResponse<Task[]>> {
    const response = await this.makeRequest<TasksResponse>(API_ENDPOINTS.tasks.base);
    
    if (response.success && response.data) {
      // Backend returns { success: true, count: number, tasks: Task[] }
      // We need to return { success: true, data: Task[] }
      return {
        success: true,
        data: response.data.tasks || [],
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to fetch tasks',
    };
  }

  async createTask(task: CreateTaskData): Promise<ApiResponse<Task>> {
    const response = await this.makeRequest<TaskResponse>(API_ENDPOINTS.tasks.create, {
      method: 'POST',
      body: JSON.stringify(task),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.task,
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create task',
    };
  }

  async updateTask(id: string, task: Partial<Task>): Promise<ApiResponse<Task>> {
    const response = await this.makeRequest<TaskResponse>(API_ENDPOINTS.tasks.update(id), {
      method: 'PUT',
      body: JSON.stringify(task),
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.task,
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update task',
    };
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    return this.makeRequest(API_ENDPOINTS.tasks.delete(id), {
      method: 'DELETE',
    });
  }

  async getTaskById(id: string): Promise<ApiResponse<Task>> {
    return this.makeRequest<Task>(API_ENDPOINTS.tasks.getById(id));
  }

  async getTaskStats(): Promise<ApiResponse<{
    total: number;
    pending: number;
    completed: number;
    overdue: number;
  }>> {
    return this.makeRequest(`${API_ENDPOINTS.tasks.base}/stats`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.makeRequest(API_ENDPOINTS.health);
  }
}

export const apiService = new ApiService();

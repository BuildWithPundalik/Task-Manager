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

class ApiService {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
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
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
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
    try {
      const response = await fetch(API_ENDPOINTS.tasks.base, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Backend returns { success: true, count: number, tasks: Task[] }
      // We need to return { success: true, data: Task[] }
      return {
        success: true,
        data: data.tasks,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async createTask(task: CreateTaskData): Promise<ApiResponse<Task>> {
    try {
      const response = await fetch(API_ENDPOINTS.tasks.create, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Backend returns { success: true, message: string, task: Task }
      // We need to return { success: true, data: Task }
      return {
        success: true,
        data: data.task,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateTask(id: string, task: Partial<Task>): Promise<ApiResponse<Task>> {
    try {
      const response = await fetch(API_ENDPOINTS.tasks.update(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Backend returns { success: true, message: string, task: Task }
      // We need to return { success: true, data: Task }
      return {
        success: true,
        data: data.task,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.tasks.delete(id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
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

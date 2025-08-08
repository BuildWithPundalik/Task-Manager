'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@/lib/types';
import { apiService } from '@/lib/api-service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!user;

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Invalid token format:', error);
      return true;
    }
  };

  // Get stored user data
  const getStoredUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  };

  // Store user data
  const storeUser = (userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  // Clear stored data
  const clearStoredData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  // Check token validity and refresh profile if needed
  const validateAndRefreshAuth = async (): Promise<boolean> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      const storedUser = getStoredUser();
      if (storedUser) {
        clearStoredData();
      }
      setUser(null);
      return false;
    }

    if (isTokenExpired(token)) {
      console.log('Token expired, clearing auth data');
      clearStoredData();
      setUser(null);
      return false;
    }

    // Check if we have stored user data
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      return true;
    }

    // If no stored user data, fetch from server
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        const userData: User = {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        };
        setUser(userData);
        storeUser(userData);
        return true;
      } else {
        console.log('Profile fetch failed, clearing auth data');
        clearStoredData();
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Failed to validate auth:', error);
      clearStoredData();
      setUser(null);
      return false;
    }
  };

  const refreshProfile = async () => {
    try {
      setIsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        clearStoredData();
        setUser(null);
        return;
      }

      if (isTokenExpired(token)) {
        console.log('Token expired during refresh');
        clearStoredData();
        setUser(null);
        return;
      }

      const response = await apiService.getProfile();

      if (response.success && response.data) {
        const userData: User = {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        };
        setUser(userData);
        storeUser(userData);
      } else {
        console.log('Profile refresh failed, clearing auth data');
        clearStoredData();
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      clearStoredData();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup token validation interval
  const setupTokenValidation = () => {
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
    }

    // Check token every 5 minutes
    tokenCheckInterval.current = setInterval(async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token && isTokenExpired(token)) {
        console.log('Token expired, logging out');
        await logout();
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await validateAndRefreshAuth();
      setIsLoading(false);
      setupTokenValidation();
    };

    initializeAuth();

    // Cleanup interval on unmount
    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        const token = response.data.token;
        const userData: User = {
          _id: response.data.user._id,
          name: response.data.user.name,
          email: response.data.user.email,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.updatedAt,
        };

        // Store both token and user data
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        storeUser(userData);
        setUser(userData);
        setupTokenValidation();
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await apiService.register(name, email, password);
      
      if (response.success && response.data) {
        const token = response.data.token;
        const userData: User = {
          _id: response.data.user._id,
          name: response.data.user.name,
          email: response.data.user.email,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.updatedAt,
        };

        // Store both token and user data
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        storeUser(userData);
        setUser(userData);
        setupTokenValidation();
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token && !isTokenExpired(token)) {
        await apiService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearStoredData();
      setUser(null);
      
      // Clear token validation interval
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
        tokenCheckInterval.current = null;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

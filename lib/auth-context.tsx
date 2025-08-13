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
  updateUserData: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize user from localStorage immediately to prevent flash
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        const parsed = JSON.parse(storedUser);
        // Quick token expiry check
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          if (payload.exp > currentTime) {
            console.log('Initializing with stored user:', parsed.name);
            return parsed;
          }
        } catch {
          console.log('Invalid token format, clearing data');
        }
      }
    } catch (error) {
      console.error('Error initializing user from localStorage:', error);
    }
    
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!user;

  // Check if user should remain authenticated based on stored token
  const shouldRemainAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      console.log('No token or user data found - user needs to login');
      return false;
    }
    
    if (isTokenExpired(token)) {
      console.log('Token expired - user needs to login again');
      clearStoredData();
      return false;
    }
    
    console.log('Valid token found - user remains authenticated');
    return true;
  };

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
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        console.log('Retrieved stored user:', parsed.name || 'unnamed user');
        return parsed;
      }
      console.log('No stored user found');
      return null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('user'); // Clear corrupted data
      return null;
    }
  };

  // Store user data
  const storeUser = (userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Stored user data for:', userData.name);
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
      console.log('No token found');
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

    // If user is already set and valid, don't fetch again
    if (user && user._id && user.name && user.email) {
      console.log('User already validated:', user.name);
      return true;
    }

    // Check if we have stored user data and it's valid
    const storedUser = getStoredUser();
    if (storedUser && storedUser._id && storedUser.name && storedUser.email) {
      console.log('Loading user from localStorage:', storedUser.name);
      setUser(storedUser);
      return true;
    }

    // If no valid stored user data, fetch from server
    try {
      console.log('Fetching user profile from server...');
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        const userData: User = {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        };
        console.log('User profile fetched from server:', userData.name);
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
        console.log('No token found during refresh');
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

      console.log('Refreshing profile from server...');
      const response = await apiService.getProfile();

      if (response.success && response.data) {
        const userData: User = {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        };
        console.log('Profile refreshed successfully:', userData.name);
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
      
      if (!token) {
        console.log('No token found in interval check');
        return;
      }
      
      if (isTokenExpired(token)) {
        console.log('Token expired during interval check, logging out');
        await logout();
        return;
      }
      
      // Check if token expires in the next 10 minutes and refresh profile to keep session alive
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - currentTime;
        
        // If token expires in less than 10 minutes, refresh profile to extend session
        if (timeUntilExpiry < 600) { // 600 seconds = 10 minutes
          console.log('Token expires soon, refreshing profile to extend session');
          await refreshProfile();
        }
      } catch (error) {
        console.error('Error checking token expiry time:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Starting auth initialization...');
        
        // If user is already loaded from localStorage, just validate the token
        if (user) {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          if (token && !isTokenExpired(token)) {
            console.log('User already loaded from localStorage, token is valid');
            setIsLoading(false);
            setupTokenValidation();
            return;
          } else {
            console.log('Token invalid, clearing user');
            clearStoredData();
            setUser(null);
          }
        }
        
        // Otherwise, run full validation
        const isAuthenticated = await validateAndRefreshAuth();
        console.log('Auth initialization complete:', isAuthenticated ? 'authenticated' : 'not authenticated');
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearStoredData();
        setUser(null);
      } finally {
        setIsLoading(false);
        setupTokenValidation();
      }
    };

    initializeAuth();

    // Cleanup interval on unmount
    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

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
        // Handle specific login errors
        const errorMessage = response.error || 'Login failed';
        if (errorMessage.includes('Invalid credentials') || errorMessage.includes('incorrect password') || errorMessage.includes('user not found')) {
          return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
        }
        return { success: false, error: errorMessage };
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

  // Update user data in both state and localStorage
  const updateUserData = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updating user data in auth context:', updatedUser.name);
    setUser(updatedUser);
    storeUser(updatedUser);
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
        updateUserData,
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

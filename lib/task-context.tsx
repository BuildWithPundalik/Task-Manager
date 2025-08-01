'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService } from '@/lib/api-service';
import { Task, CreateTaskData } from '@/lib/types';
import { useAuth } from './auth-context';

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: CreateTaskData) => Promise<{ success: boolean; error?: string }>;
  updateTask: (id: string, task: Partial<Task>) => Promise<{ success: boolean; error?: string }>;
  deleteTask: (id: string) => Promise<{ success: boolean; error?: string }>;
  getTaskById: (id: string) => Task | undefined;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getTasks();
      
      if (response.success && response.data) {
        setTasks(response.data);
      } else {
        setError(response.error || 'Failed to fetch tasks');
      }
    } catch (error) {
      setError('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [isAuthenticated]);

  const createTask = async (taskData: CreateTaskData) => {
    try {
      const response = await apiService.createTask(taskData);
      
      if (response.success && response.data) {
        setTasks(prev => [...prev, response.data!]);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to create task' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to create task' };
    }
  };

  const updateTask = async (id: string, taskData: Partial<Task>) => {
    try {
      const response = await apiService.updateTask(id, taskData);
      
      if (response.success && response.data) {
        setTasks(prev => prev.map(task => 
          task._id === id ? response.data! : task
        ));
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to update task' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to update task' };
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const response = await apiService.deleteTask(id);
      
      if (response.success) {
        setTasks(prev => prev.filter(task => task._id !== id));
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to delete task' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to delete task' };
    }
  };

  const getTaskById = (id: string): Task | undefined => {
    return tasks.find(task => task._id === id);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        getTaskById,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

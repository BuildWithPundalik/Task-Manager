// Shared types for the Task Manager application

// Backend uses capitalized status values
export type StoredTaskStatus = "Pending" | "Completed"
export type DisplayTaskStatus = "pending" | "overdue" | "completed"
export type TaskPriority = "low" | "medium" | "high"

// Frontend Task interface that matches the backend API
export interface Task {
  _id?: string
  title: string
  description: string
  status: StoredTaskStatus
  priority: TaskPriority
  dueDate: string // ISO string
  userId?: string
  createdAt?: string // ISO string
  updatedAt?: string // ISO string
}

// Interface for new task creation
export interface CreateTaskData {
  title: string
  description: string
  status: StoredTaskStatus
  priority: TaskPriority
  dueDate: string
}

// Interface for task counts
export interface TaskCounts {
  total: number
  pending: number
  completed: number
  overdue: number
}

// Interface for new task form
export interface NewTaskForm {
  title: string
  description: string
  priority: TaskPriority
  dueDate: Date
}

// User interface matching backend
export interface User {
  _id: string
  name: string
  email: string
  createdAt?: string
  updatedAt?: string
}

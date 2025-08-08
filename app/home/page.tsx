"use client"

import { useState } from "react"
import { Navbar } from "@/components/sections/navbar"
import { DashboardHeader } from "@/components/sections/dashboard-header"
import { StatsCards } from "@/components/sections/stats-cards"
import { Filters } from "@/components/sections/filters"
import { TaskGrid } from "@/components/sections/task-grid"
import { EditTaskDialog } from "@/components/sections/edit-task-dialog"
import { ProtectedRoute } from "@/components/protected-route"
import { useTasks } from "@/lib/task-context"
import { Task, StoredTaskStatus, DisplayTaskStatus, NewTaskForm, CreateTaskData } from "@/lib/types"

// This function will determine the *displayed* status
const getDisplayStatus = (task: Task): DisplayTaskStatus => {
  if (task.status === "Completed") {
    return "completed"
  }
  // If not completed, check if it's overdue
  if (task.dueDate && new Date() > new Date(task.dueDate)) {
    return "overdue"
  }
  return "pending" // Otherwise, it's a pending task
}

// Convert frontend display status to backend status
const convertToBackendStatus = (status: string): StoredTaskStatus => {
  switch (status) {
    case "pending":
      return "Pending"
    case "completed":
      return "Completed"
    default:
      return "Pending"
  }
}

const getTimeRemaining = (dueDate: string): { text: string; color: string; isUrgent: boolean } => {
  const now = new Date()
  const dueDateObj = new Date(dueDate)
  const timeDiff = dueDateObj.getTime() - now.getTime()

  if (timeDiff < 0) {
    const overdueDays = Math.floor(Math.abs(timeDiff) / (1000 * 60 * 60 * 24))
    return {
      text: overdueDays === 0 ? "Overdue today" : `${overdueDays} days overdue`,
      color: "text-red-600",
      isUrgent: true,
    }
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 7) {
    return {
      text: `${days} days left`,
      color: "text-green-600",
      isUrgent: false,
    }
  } else if (days > 2) {
    return {
      text: `${days} days left`,
      color: "text-yellow-600",
      isUrgent: false,
    }
  } else if (days > 0) {
    return {
      text: `${days} day${days > 1 ? "s" : ""} ${hours}h left`,
      color: "text-orange-600",
      isUrgent: true,
    }
  } else if (hours > 0) {
    return {
      text: `${hours}h ${minutes}m left`,
      color: "text-red-500",
      isUrgent: true,
    }
  } else {
    return {
      text: `${minutes}m left`,
      color: "text-red-600",
      isUrgent: true,
    }
  }
}

function TaskManagerContent() {
  const { tasks, isLoading, error, createTask, updateTask, deleteTask } = useTasks()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<DisplayTaskStatus | "all">("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: "",
    description: "",
    priority: "medium",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
  })

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterStatus === "all" || getDisplayStatus(task) === filterStatus
    return matchesSearch && matchesFilter
  })

  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter((t) => getDisplayStatus(t) === "pending").length,
    completed: tasks.filter((t) => getDisplayStatus(t) === "completed").length,
    overdue: tasks.filter((t) => getDisplayStatus(t) === "overdue").length,
  }

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return

    const taskData: CreateTaskData = {
      title: newTask.title,
      description: newTask.description,
      status: "Pending", // Backend expects capitalized status
      priority: newTask.priority,
      dueDate: newTask.dueDate.toISOString(),
    }

    const result = await createTask(taskData)
    if (result.success) {
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      setIsAddDialogOpen(false)
    }
  }

  const handleUpdateTask = async (updatedTask: Task) => {
    if (!updatedTask._id) return
    
    const result = await updateTask(updatedTask._id, updatedTask)
    if (result.success) {
      setEditingTask(null)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId)
  }

  const changeTaskStatus = async (taskId: string, newStatus: string) => {
    const backendStatus = convertToBackendStatus(newStatus)
    await updateTask(taskId, { status: backendStatus })
  }

  const handleSetEditingTask = (task: Task) => {
    setEditingTask(task)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Dashboard Header with Add Task */}
        <DashboardHeader 
          isAddDialogOpen={isAddDialogOpen}
          setIsAddDialogOpen={setIsAddDialogOpen}
          newTask={newTask}
          setNewTask={setNewTask}
          addTask={handleAddTask}
        />

        {/* Stats Cards */}
        <StatsCards taskCounts={taskCounts} />

        {/* Filters */}
        <Filters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        {/* Tasks Grid */}
        <TaskGrid 
          filteredTasks={filteredTasks}
          getDisplayStatus={getDisplayStatus}
          getTimeRemaining={getTimeRemaining}
          changeTaskStatus={changeTaskStatus}
          setEditingTask={handleSetEditingTask}
          deleteTask={handleDeleteTask}
        />

        {/* Edit Task Dialog */}
        <EditTaskDialog 
          editingTask={editingTask}
          setEditingTask={setEditingTask}
          updateTask={handleUpdateTask}
          getDisplayStatus={getDisplayStatus}
        />
      </main>
    </div>
  )
}

export default function TaskManager() {
  return (
    <ProtectedRoute>
      <TaskManagerContent />
    </ProtectedRoute>
  )
}

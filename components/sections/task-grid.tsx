import { MoreHorizontal, Edit, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Task, StoredTaskStatus, DisplayTaskStatus, TaskPriority } from "@/lib/types"

interface TaskGridProps {
  filteredTasks: Task[]
  getDisplayStatus: (task: Task) => DisplayTaskStatus
  getTimeRemaining: (dueDate: string) => { text: string; color: string; isUrgent: boolean }
  changeTaskStatus: (taskId: string, newStatus: string) => void
  setEditingTask: (task: Task) => void
  deleteTask: (taskId: string) => void
}

export function TaskGrid({ 
  filteredTasks, 
  getDisplayStatus, 
  getTimeRemaining, 
  changeTaskStatus, 
  setEditingTask, 
  deleteTask 
}: TaskGridProps) {
  const getStatusIcon = (status: DisplayTaskStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "overdue":
        return <AlertCircle className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: DisplayTaskStatus) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-green-100 text-green-800"
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
    }
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No tasks found</div>
        <p className="text-gray-400">Try adjusting your search or filter criteria</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTasks.map((task) => (
        <Card key={task._id || Math.random().toString()} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{task.title}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => task._id && changeTaskStatus(task._id, "pending")}>
                    <Clock className="w-4 h-4 mr-2" />
                    Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => task._id && changeTaskStatus(task._id, "completed")}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={getStatusColor(getDisplayStatus(task))}>
                {getStatusIcon(getDisplayStatus(task))}
                <span className="ml-1 capitalize">{getDisplayStatus(task).replace("-", " ")}</span>
              </Badge>
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Created: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown'}</span>
                <span className={getDisplayStatus(task) === "overdue" ? "text-red-600 font-medium" : ""}>
                  Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </span>
              </div>
              {getDisplayStatus(task) !== "completed" && task.dueDate && (
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-medium ${getTimeRemaining(task.dueDate).color}`}>
                    {getTimeRemaining(task.dueDate).text}
                  </div>
                  {getTimeRemaining(task.dueDate).isUrgent && (
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          getDisplayStatus(task) === "overdue" ? "bg-red-500" : "bg-orange-500"
                        } animate-pulse`}
                      ></div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingTask(task)}
                className="flex-1 h-8 text-xs"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => task._id && deleteTask(task._id)}
                className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

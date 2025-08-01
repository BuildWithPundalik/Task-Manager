import { AddTaskDialog } from "./add-task-dialog"
import { NewTaskForm } from "@/lib/types"

interface DashboardHeaderProps {
  isAddDialogOpen: boolean
  setIsAddDialogOpen: (open: boolean) => void
  newTask: NewTaskForm
  setNewTask: (task: NewTaskForm) => void
  addTask: () => void
}

export function DashboardHeader({ 
  isAddDialogOpen, 
  setIsAddDialogOpen, 
  newTask, 
  setNewTask, 
  addTask 
}: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Manage your tasks and track your progress</p>
      </div>
      <div>
        <AddTaskDialog 
          isAddDialogOpen={isAddDialogOpen}
          setIsAddDialogOpen={setIsAddDialogOpen}
          newTask={newTask}
          setNewTask={setNewTask}
          addTask={addTask}
        />
      </div>
    </div>
  )
}

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Task, DisplayTaskStatus, TaskPriority } from "@/lib/types"

interface EditTaskDialogProps {
  editingTask: Task | null
  setEditingTask: (task: Task | null) => void
  updateTask: (task: Task) => void
  getDisplayStatus: (task: Task) => DisplayTaskStatus
}

export function EditTaskDialog({ editingTask, setEditingTask, updateTask, getDisplayStatus }: EditTaskDialogProps) {
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

  if (!editingTask) return null

  return (
    <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={editingTask.title}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={editingTask.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingTask({ ...editingTask, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={editingTask.priority}
                onValueChange={(value: TaskPriority) => setEditingTask({ ...editingTask, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={editingTask.dueDate ? editingTask.dueDate.split("T")[0] : ""}
                onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="completed"
              checked={editingTask.status === "Completed"}
              onCheckedChange={(checked: boolean) =>
                setEditingTask({ ...editingTask, status: checked ? "Completed" : "Pending" })
              }
            />
            <Label htmlFor="completed">Mark as Completed</Label>
            <Badge className={getStatusColor(getDisplayStatus(editingTask))}>
              {getStatusIcon(getDisplayStatus(editingTask))}
              <span className="ml-1 capitalize">{getDisplayStatus(editingTask).replace("-", " ")}</span>
            </Badge>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button onClick={() => updateTask(editingTask)}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

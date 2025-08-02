import { useState, useEffect } from "react"
import { User, Mail, Calendar, Edit, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserInfo {
  id: string
  name: string
  email: string
  joinedAt: Date
  avatar?: string
}

interface UserInfoDisplayProps {
  userInfo: UserInfo
  onUpdateUser: (updatedUser: UserInfo) => void
}

export function UserInfoDisplay({ userInfo, onUpdateUser }: UserInfoDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<UserInfo>(userInfo)

  // Helper function to get user initials safely
  const getInitials = (name: string | undefined | null): string => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return 'U'
    }
    
    return name
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSave = () => {
    // Validate that name is not empty
    if (!editedUser.name || editedUser.name.trim() === '') {
      console.warn('Name cannot be empty, not saving')
      return
    }
    
    // Ensure the editedUser has the trimmed name
    const updatedUser = {
      ...editedUser,
      name: editedUser.name.trim(),
      email: editedUser.email.trim()
    }
    
    console.log('Saving user data:', updatedUser) // Debug log
    
    // Call the parent's update function
    onUpdateUser(updatedUser)
    // Exit edit mode
    setIsEditing(false)
  }

  // Update editedUser when userInfo prop changes
  useEffect(() => {
    console.log('UserInfo prop changed:', userInfo) // Debug log
    setEditedUser(userInfo)
  }, [userInfo])

  const handleCancel = () => {
    setEditedUser(userInfo)
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center">
            <User className="w-6 h-6 mr-2" />
            User Profile
          </CardTitle>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {getInitials(userInfo.name)}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{userInfo.name || 'User'}</h3>
            <p className="text-gray-500">Member since {userInfo.joinedAt.toLocaleDateString()}</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={editedUser.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1"
              />
            ) : (
              <div className="mt-1 p-2 border rounded-md bg-gray-50">
                {userInfo.name && userInfo.name.trim() !== '' ? userInfo.name : 'No name provided'}
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={editedUser.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1"
              />
            ) : (
              <div className="mt-1 p-2 border rounded-md bg-gray-50">
                {userInfo.email || 'No email provided'}
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-lg font-semibold mb-3 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Account Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Member since:</span> {userInfo.joinedAt.toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">User ID:</span> {userInfo.id}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

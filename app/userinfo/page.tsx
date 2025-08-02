"use client"

import { useState, useEffect, useRef } from "react"
import { Navbar } from "@/components/sections/navbar"
import { UserInfoDisplay } from "@/components/sections/userinfo/user-info-display"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { apiService } from "@/lib/api-service"

interface UserInfo {
  id: string
  name: string
  email: string
  joinedAt: Date
  avatar?: string
}

export default function UserInfoPage() {
  const { user, refreshProfile } = useAuth()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isUpdatingRef = useRef(false) // Track if we're in the middle of an update

  // Function to fetch fresh user data from server
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getProfile()
      
      if (response.success && response.data) {
        const userData = response.data
        
        const transformedUserInfo: UserInfo = {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          joinedAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
        }
        
        setUserInfo(transformedUserInfo)
      } else {
        console.error("Failed to fetch user profile:", response.error)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Don't update from auth context if we're in the middle of updating
    if (isUpdatingRef.current) {
      console.log('Skipping useEffect update - currently updating')
      return
    }
    
    if (user) {
      // Transform backend user data to frontend UserInfo format
      const transformedUserInfo: UserInfo = {
        id: user._id,
        name: user.name,
        email: user.email,
        joinedAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      }
      
      console.log('useEffect triggered with user:', transformedUserInfo) // Debug log
      setUserInfo(transformedUserInfo)
      setIsLoading(false)
    } else {
      // If no user in context, try fetching from server
      fetchUserProfile()
    }
  }, [user]) // This will re-run whenever user changes

  const handleUpdateUser = async (updatedUser: UserInfo) => {
    console.log('Received updated user data:', updatedUser) // Debug log
    
    // Set flag to prevent useEffect from overriding our update
    isUpdatingRef.current = true
    
    try {
      // Call API service to update user profile
      const response = await apiService.updateProfile({
        name: updatedUser.name,
        email: updatedUser.email,
      })

      if (response.success) {
        console.log('API update successful, updating local state') // Debug log
        
        // Update local state first with the new data
        setUserInfo(updatedUser)
        
        // Refresh the user data in auth context
        await refreshProfile()
        
        console.log("User updated successfully")
        console.log("Final local userInfo:", updatedUser) // Debug log
      } else {
        console.error("Failed to update user:", response.error)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      // Reset the flag after a delay to allow auth context to update
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 1000)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!userInfo) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User data not found</h2>
            <p className="text-gray-600">Please try logging in again.</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Navbar />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link href="/home" className="flex items-center hover:text-gray-900 transition-colors">
              <Home className="w-4 h-4 mr-1" />
              Dashboard
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">User Profile</span>
          </nav>

          <div className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Profile</h1>
              <p className="text-gray-600">Manage your personal information and account details</p>
            </div>
          </div>

          <UserInfoDisplay 
            key={userInfo.id + userInfo.name + userInfo.email} // Force re-render when data changes
            userInfo={userInfo} 
            onUpdateUser={handleUpdateUser}
          />
        </main>
      </div>
    </ProtectedRoute>
  )
}

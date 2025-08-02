"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  const { login, register } = useAuth()
  const router = useRouter()

  // Debounced validation to avoid excessive API calls or validation
  const debounceValidation = useCallback((field: string, value: string) => {
    const timer = setTimeout(() => {
      if (value.trim()) {
        let error: string | null = null
        switch (field) {
          case 'email':
            error = validateEmail(value)
            break
          case 'password':
            error = validatePassword(value)
            break
          case 'name':
            error = validateName(value)
            break
          case 'confirmPassword':
            error = validateConfirmPassword(password, value)
            break
        }
        if (error) {
          setFieldErrors(prev => ({ ...prev, [field]: error }))
        }
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [password])

  // Validation functions
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return "Email is required"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }
    return null
  }

  const validatePassword = (password: string): string | null => {
    if (!password) {
      return "Password is required"
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long"
    }
    if (password.length > 128) {
      return "Password must be less than 128 characters"
    }
    // Check for at least one letter and one number
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return "Password must contain at least one letter and one number"
    }
    return null
  }

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' }
    
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 8) score += 1
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) score += 1
    if (/(?=.*\d)/.test(password)) score += 1
    if (/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) score += 1
    
    if (score <= 2) return { score, label: 'Weak', color: 'text-red-600' }
    if (score <= 3) return { score, label: 'Fair', color: 'text-yellow-600' }
    if (score <= 4) return { score, label: 'Good', color: 'text-blue-600' }
    return { score, label: 'Strong', color: 'text-green-600' }
  }

  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return "Full name is required"
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long"
    }
    if (name.trim().length > 50) {
      return "Name must be less than 50 characters"
    }
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes"
    }
    return null
  }

  const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) {
      return "Please confirm your password"
    }
    if (password !== confirmPassword) {
      return "Passwords do not match"
    }
    return null
  }

  // Real-time field validation
  const handleFieldChange = (field: string, value: string) => {
    // Clear the specific field error when user starts typing
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
    
    // Update the field value
    switch (field) {
      case 'name':
        setName(value)
        break
      case 'email':
        setEmail(value)
        break
      case 'password':
        setPassword(value)
        // Also clear confirm password error if passwords now match
        if (isRegisterMode && confirmPassword && value === confirmPassword) {
          setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }))
        }
        break
      case 'confirmPassword':
        setConfirmPassword(value)
        break
    }
  }

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {}
    
    // Email validation
    const emailError = validateEmail(email)
    if (emailError) errors.email = emailError

    // Password validation
    const passwordError = validatePassword(password)
    if (passwordError) errors.password = passwordError

    // Registration-specific validations
    if (isRegisterMode) {
      // Name validation
      const nameError = validateName(name)
      if (nameError) errors.name = nameError

      // Confirm password validation
      const confirmPasswordError = validateConfirmPassword(password, confirmPassword)
      if (confirmPasswordError) errors.confirmPassword = confirmPasswordError
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validate form before proceeding
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)

    try {
      let result
      
      if (isRegisterMode) {
        // Additional security checks for registration
        const trimmedName = name.trim()
        const trimmedEmail = email.trim().toLowerCase()
        
        // Check if email format is valid (additional check)
        if (!trimmedEmail.includes('@') || trimmedEmail.length > 254) {
          setError("Please enter a valid email address")
          setIsLoading(false)
          return
        }
        
        result = await register(trimmedName, trimmedEmail, password)
      } else {
        // Login with normalized email
        const trimmedEmail = email.trim().toLowerCase()
        result = await login(trimmedEmail, password)
      }

      if (result.success) {
        // Clear sensitive data from memory
        setPassword("")
        setConfirmPassword("")
        router.push("/home")
      } else {
        // Handle specific error messages
        const errorMessage = result.error || `${isRegisterMode ? 'Registration' : 'Login'} failed`
        
        // Don't reveal too much information about why login failed
        if (!isRegisterMode && (errorMessage.includes('user') || errorMessage.includes('email'))) {
          setError("Invalid email or password")
        } else {
          setError(errorMessage)
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">
                  {isRegisterMode ? "Create your account" : "Login to your account"}
                </CardTitle>
                <CardDescription>
                  {isRegisterMode 
                    ? "Enter your details below to create your account"
                    : "Enter your email below to login to your account"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className={cn("flex flex-col gap-6")} onSubmit={handleSubmit}>
                  <div className="grid gap-6">
                    {isRegisterMode && (
                      <div className="grid gap-3">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          type="text" 
                          placeholder="John Doe" 
                          value={name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          required={isRegisterMode}
                          className={fieldErrors.name ? "border-red-500 focus:border-red-500" : ""}
                        />
                        {fieldErrors.name && (
                          <p className="text-sm text-red-600">{fieldErrors.name}</p>
                        )}
                      </div>
                    )}
                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="m@example.com" 
                        value={email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        required 
                        className={fieldErrors.email ? "border-red-500 focus:border-red-500" : ""}
                      />
                      {fieldErrors.email && (
                        <p className="text-sm text-red-600">{fieldErrors.email}</p>
                      )}
                    </div>
                    <div className="grid gap-3">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        {!isRegisterMode && (
                          <a
                            href="#"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                            onClick={(e) => e.preventDefault()}
                          >
                            Forgot your password?
                          </a>
                        )}
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder={isRegisterMode ? "Create a password" : "Enter your password"}
                        value={password}
                        onChange={(e) => handleFieldChange('password', e.target.value)}
                        required 
                        className={fieldErrors.password ? "border-red-500 focus:border-red-500" : ""}
                      />
                      {fieldErrors.password && (
                        <p className="text-sm text-red-600">{fieldErrors.password}</p>
                      )}
                      {isRegisterMode && !fieldErrors.password && password && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">Password strength:</p>
                            <span className={`text-sm font-medium ${getPasswordStrength(password).color}`}>
                              {getPasswordStrength(password).label}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                getPasswordStrength(password).score <= 2 ? 'bg-red-500' :
                                getPasswordStrength(password).score <= 3 ? 'bg-yellow-500' :
                                getPasswordStrength(password).score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${(getPasswordStrength(password).score / 5) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Use 8+ characters with uppercase, lowercase, numbers, and symbols
                          </p>
                        </div>
                      )}
                    </div>
                    {isRegisterMode && (
                      <div className="grid gap-3">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                          required={isRegisterMode}
                          className={fieldErrors.confirmPassword ? "border-red-500 focus:border-red-500" : ""}
                        />
                        {fieldErrors.confirmPassword && (
                          <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                        )}
                      </div>
                    )}
                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {error}
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || Object.keys(fieldErrors).some(key => fieldErrors[key as keyof typeof fieldErrors])}
                    >
                      {isLoading 
                        ? (isRegisterMode ? "Creating account..." : "Logging in...") 
                        : (isRegisterMode ? "Create Account" : "Login")
                      }
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    {isRegisterMode ? (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegisterMode(false)
                            setError("")
                            setFieldErrors({})
                            setName("")
                            setConfirmPassword("")
                          }}
                          className="underline underline-offset-4 hover:text-primary"
                        >
                          Login here
                        </button>
                      </>
                    ) : (
                      <>
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegisterMode(true)
                            setError("")
                            setFieldErrors({})
                          }}
                          className="underline underline-offset-4 hover:text-primary"
                        >
                          Register here
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}

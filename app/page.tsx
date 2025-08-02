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
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const { login } = useAuth()
  const router = useRouter()

  // Validation functions - only for format checking
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
    return null
  }

  // Real-time field validation
  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'email':
        setEmail(value)
        // Clear specific email errors when user starts typing
        if (fieldErrors.email) {
          setFieldErrors(prev => ({ ...prev, email: undefined }))
        }
        break
      case 'password':
        setPassword(value)
        // Clear password-related errors when user starts typing
        if (fieldErrors.password) {
          setFieldErrors(prev => ({ ...prev, password: undefined }))
        }
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
      // Login with normalized email
      const trimmedEmail = email.trim().toLowerCase()
      const result = await login(trimmedEmail, password)

      if (result.success) {
        // Clear sensitive data from memory
        setPassword("")
        router.push("/home")
      } else {
        // Handle specific error messages
        const errorMessage = result.error || 'Login failed'
        
        // Don't reveal too much information about why login failed
        if (errorMessage.includes('user') || errorMessage.includes('email')) {
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
                  Login to your account
                </CardTitle>
                <CardDescription>
                  Enter your email below to login to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className={cn("flex flex-col gap-6")} onSubmit={handleSubmit}>
                  <div className="grid gap-6">
                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="m@example.com" 
                        value={email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required 
                        className={`${fieldErrors.email ? "border-red-500 focus:border-red-500" : ""} [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset]`}
                        autoComplete="email"
                      />
                      {fieldErrors.email && (
                        <p className="text-sm text-red-600">{fieldErrors.email}</p>
                      )}
                    </div>
                    <div className="grid gap-3">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <a
                          href="#"
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                          onClick={(e) => e.preventDefault()}
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required 
                        className={`${fieldErrors.password ? "border-red-500 focus:border-red-500" : ""} [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset]`}
                        autoComplete="current-password"
                      />
                      {fieldErrors.password && (
                        <p className="text-sm text-red-600">{fieldErrors.password}</p>
                      )}
                    </div>
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
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                    
                    <div className="text-center text-sm">
                      Don&apos;t have an account?{" "}

                      <a
                        href="/register"
                        className="underline underline-offset-4 hover:text-primary"
                      >
                        Registration
                      </a>
                    </div>
                
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

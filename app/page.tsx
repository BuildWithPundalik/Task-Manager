"use client"

import { useState } from "react"
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
  const { login, register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      let result
      
      if (isRegisterMode) {
        // Registration validation
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          setIsLoading(false)
          return
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters long")
          setIsLoading(false)
          return
        }
        
        result = await register(name, email, password)
      } else {
        // Login
        result = await login(email, password)
      }

      if (result.success) {
        router.push("/home")
      } else {
        setError(result.error || `${isRegisterMode ? 'Registration' : 'Login'} failed`)
      }
    } catch (error) {
      setError("An unexpected error occurred")
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
                          onChange={(e) => setName(e.target.value)}
                          required={isRegisterMode}
                        />
                      </div>
                    )}
                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="m@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="grid gap-3">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        {!isRegisterMode && (
                          <a
                            href="#"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
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
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                    </div>
                    {isRegisterMode && (
                      <div className="grid gap-3">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required={isRegisterMode}
                        />
                      </div>
                    )}
                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {error}
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
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

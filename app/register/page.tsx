'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const { register } = useAuth();
  const router = useRouter();

  // Validation functions
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    if (email.length > 254) {
      return "Email address is too long";
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (password.length > 128) {
      return "Password must be less than 128 characters";
    }
    // Check for at least one letter and one number
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return "Password must contain at least one letter and one number";
    }
    return null;
  };

  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return "Full name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (name.trim().length > 50) {
      return "Name must be less than 50 characters";
    }
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes";
    }
    return null;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) score += 1;
    if (/(?=.*\d)/.test(password)) score += 1;
    if (/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) score += 1;
    
    if (score <= 2) return { score, label: 'Weak', color: 'text-red-600' };
    if (score <= 3) return { score, label: 'Fair', color: 'text-yellow-600' };
    if (score <= 4) return { score, label: 'Good', color: 'text-blue-600' };
    return { score, label: 'Strong', color: 'text-green-600' };
  };

  // Real-time field validation
  const handleFieldChange = (field: string, value: string) => {
    // Clear the specific field error when user starts typing
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Update the field value
    switch (field) {
      case 'name':
        setName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        // Also clear confirm password error if passwords now match
        if (confirmPassword && value === confirmPassword) {
          setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
        }
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    
    // Name validation
    const nameError = validateName(name);
    if (nameError) errors.name = nameError;

    // Email validation
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    // Password validation
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    // Confirm password validation
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Additional security checks
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();
      
      // Final validation before API call
      if (!trimmedEmail.includes('@') || trimmedEmail.length > 254) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      const result = await register(trimmedName, trimmedEmail, password);
      if (result.success) {
        // Clear sensitive data from memory
        setPassword("");
        setConfirmPassword("");
        router.push("/");
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Card className={cn("w-full max-w-md")}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>
              Enter your information below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="your name" 
                    value={name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    required 
                    className={`${fieldErrors.name ? "border-red-500 focus:border-red-500" : ""} [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset]`}
                    autoComplete="name"
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    value={email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    required 
                    className={`${fieldErrors.email ? "border-red-500 focus:border-red-500" : ""} [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset]`}
                    autoComplete="email"
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    required 
                    className={`${fieldErrors.password ? "border-red-500 focus:border-red-500" : ""} [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset]`}
                    autoComplete="new-password"
                  />
                  {fieldErrors.password && (
                    <p className="text-sm text-red-600">{fieldErrors.password}</p>
                  )}
                  {!fieldErrors.password && password && (
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
                <div className="grid gap-3">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                    required 
                    className={`${fieldErrors.confirmPassword ? "border-red-500 focus:border-red-500" : ""} [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset]`}
                    autoComplete="new-password"
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                  {!fieldErrors.confirmPassword && confirmPassword && password === confirmPassword && (
                    <p className="text-sm text-green-600">✓ Passwords match</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={
                    isLoading || 
                    Object.keys(fieldErrors).some(key => fieldErrors[key as keyof typeof fieldErrors]) ||
                    !name.trim() || 
                    !email.trim() || 
                    !password || 
                    !confirmPassword
                  }
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/" className="underline underline-offset-4 hover:text-primary">
                  Login here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

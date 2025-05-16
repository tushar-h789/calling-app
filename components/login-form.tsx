"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { login, fetchUserProfile } from "@/store/slices/authSlice"
import { connectSocket } from "@/store/slices/socketSlice"
import { toast } from "sonner"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState("user")
  const dispatch = useAppDispatch()
  const { status, error } = useAppSelector((state) => state.auth)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Login
      const resultAction = await dispatch(login({ email, password })).unwrap()

      // Fetch user profile
      await dispatch(fetchUserProfile(resultAction.token)).unwrap()

      // Connect socket
      await dispatch(connectSocket(resultAction.token)).unwrap()

      // Navigate to dashboard
      router.push("/dashboard")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  }

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google?userType=${userType}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>User Type</Label>
          <RadioGroup value={userType} onValueChange={setUserType} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user" id="user" />
              <Label htmlFor="user">User</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="coach" id="coach" />
              <Label htmlFor="coach">Coach</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      <div className="space-y-4">
        <Button type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? "Signing in..." : "Sign In"}
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">Or continue with</span>
          </div>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
          <svg
            className="mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12 h8 M12 8 v8" />
          </svg>
          Google
        </Button>
      </div>
    </form>
  )
}

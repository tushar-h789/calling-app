"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "@/types"

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (userType: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  login: async () => { },
  loginWithGoogle: () => { },
  logout: () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for saved token on mount
    const savedToken = localStorage.getItem("token")

    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)

      // Fetch user profile
      fetchUserProfile(savedToken)
    }
  }, [])

  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      const result = await res.json()

      if (result.data) {
        setUser({
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          type: result.data.type,
          avatar: result.data.avatar_url || null,
        })
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      logout()
    }
  }

  const login = async (email: string, password: string) => {
    console.log("login", email, password);
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    // console.log("res", res);

    const data = await res.json()
    console.log("data", data);
    

    if (!data.success) {
      throw new Error(data.message || "Login failed")
    }

    const authToken = data.authorization.token
    console.log("authToken", authToken);
    // Save token to localStorage
    localStorage.setItem("token", authToken)
    localStorage.setItem("userEmail", email)

    setToken(authToken)
    setIsAuthenticated(true)

    // Fetch user profile
    await fetchUserProfile(authToken)
  }

  const loginWithGoogle = (userType: string) => {
    // Redirect to Google OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google?userType=${userType}`
  }

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("userEmail")

    // Reset state
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

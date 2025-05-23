"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { logout } from "@/store/slices/authSlice"
import { disconnectSocket } from "@/store/slices/socketSlice"
import { Logo } from "./logo"

export function DashboardHeader() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(disconnectSocket())
    dispatch(logout())
  }

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Logo className="h-8 w-8" />
          <span className="font-bold text-lg">Calling App</span>
        </Link>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-600">
            {user?.name} ({user?.type})
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}

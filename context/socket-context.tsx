"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "@/hooks/use-auth"
import type { MissedCall } from "@/types"

interface SocketContextType {
  socket: Socket | null
  socketId: string | null
  missedCalls: MissedCall[]
  clearMissedCall: (id: string) => void
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  socketId: null,
  missedCalls: [],
  clearMissedCall: () => {},
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [socketId, setSocketId] = useState<string | null>(null)
  const [missedCalls, setMissedCalls] = useState<MissedCall[]>([])
  const { token, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setSocketId(null)
      }
      return
    }

    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "", {
      auth: { token },
    })

    socketInstance.on("connect", () => {
      setSocketId(socketInstance.id)
      console.log("Socket connected:", socketInstance.id)
    })

    socketInstance.on("disconnect", () => {
      setSocketId(null)
      console.log("Socket disconnected")
    })

    socketInstance.on("missedCall", (data) => {
      console.log("Missed call:", data)

      if (!data.caller || !data.appointmentId) {
        console.error("Invalid missed call data received")
        return
      }

      const newMissedCall: MissedCall = {
        id: `${data.appointmentId}-${Date.now()}`,
        callerId: data.caller,
        appointmentId: data.appointmentId,
        timestamp: new Date().toISOString(),
        isDoctorCall: data.isDoctorCall || false,
        message: data.message || `You missed a call from your ${data.isDoctorCall ? "doctor" : "patient"}`,
      }

      setMissedCalls((prev) => [...prev, newMissedCall])
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [isAuthenticated, token])

  const clearMissedCall = (id: string) => {
    setMissedCalls((prev) => prev.filter((call) => call.id !== id))
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        socketId,
        missedCalls,
        clearMissedCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

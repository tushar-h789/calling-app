"use client"

import { useAuth } from "@/hooks/use-auth"
import { CallHistoryItem } from "@/types"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

export function CallHistory() {
  const [history, setHistory] = useState<CallHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    const fetchCallHistory = async () => {
      if (!token) return

      try {
        // This is a placeholder - you would need to implement this API endpoint
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/call-history`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await res.json()
        setHistory(data.history || [])
      } catch (error) {
        console.error("Error fetching call history:", error)
        // For demo purposes, set some sample data
        setHistory([
          {
            id: "1",
            contactName: "John Doe",
            contactEmail: "john@example.com",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            duration: 125, // seconds
            type: "video",
            status: "completed",
          },
          {
            id: "2",
            contactName: "Jane Smith",
            contactEmail: "jane@example.com",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            duration: 45, // seconds
            type: "audio",
            status: "completed",
          },
          {
            id: "3",
            contactName: "Alice Johnson",
            contactEmail: "alice@example.com",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            duration: 0,
            type: "audio",
            status: "missed",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCallHistory()
  }, [token])

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "0s"

    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60

    return `${mins > 0 ? `${mins}m ` : ""}${secs}s`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading call history...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Calls</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-4 text-slate-500">No call history found</div>
        ) : (
          <ul className="space-y-3">
            {history.map((call) => (
              <li key={call.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      call.status === "missed"
                        ? "bg-red-100 text-red-600"
                        : call.type === "video"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600"
                    }`}
                  >
                    {call.status === "missed" ? (
                      <PhoneOff className="h-4 w-4" />
                    ) : call.type === "video" ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{call.contactName}</div>
                    <div className="text-sm text-slate-500">
                      {formatDistanceToNow(new Date(call.timestamp), { addSuffix: true })}
                      {call.status !== "missed" && ` • ${formatDuration(call.duration)}`}
                    </div>
                  </div>
                </div>
                <div className={`text-sm ${call.status === "missed" ? "text-red-600" : "text-slate-500"}`}>
                  {call.status === "missed" ? "Missed" : call.type === "video" ? "Video Call" : "Audio Call"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

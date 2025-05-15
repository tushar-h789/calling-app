"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { VideoGrid } from "@/components/video-grid"
import { CallControls } from "@/components/call-controls"
import { RecordingControls } from "@/components/recording-controls"
import { CallTimer } from "@/components/call-timer"
import { useCall } from "@/hooks/use-call"
import { useAuth } from "@/hooks/use-auth"

export function CallUI() {
  const [callConnected, setCallConnected] = useState(false)
  const { callState, endCall } = useCall()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Set call as connected when remote stream is available
    if (callState.remoteStream) {
      setCallConnected(true)
    }

    // Handle call ended state
    if (callState.status === "ended") {
      router.push("/dashboard?callEnded=true")
    }

    // Auto end call after 60 minutes
    const timeout = setTimeout(
      () => {
        endCall()
      },
      60 * 60 * 1000,
    )

    return () => clearTimeout(timeout)
  }, [callState, endCall, router])

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex-1 relative">
        <VideoGrid />

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <Card className="bg-slate-800/70 text-white p-3 backdrop-blur-sm">
            <div className="text-sm font-medium">{callState.isVideoCall ? "Video Call" : "Audio Call"}</div>
            {callConnected && <CallTimer />}
          </Card>

          {user?.type === "coach" && callConnected && <RecordingControls />}
        </div>
      </div>

      <div className="p-4 bg-slate-800">
        <CallControls />
      </div>
    </div>
  )
}

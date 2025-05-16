"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { VideoGrid } from "@/components/video-grid"
import { CallControls } from "@/components/call-controls"
import { RecordingControls } from "@/components/recording-controls"
import { CallTimer } from "@/components/call-timer"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { createPeerConnection, resetCall, setCallStatus } from "@/store/slices/callSlice"

export function CallUI() {
  const dispatch = useAppDispatch()
  const { callState } = useAppSelector((state) => ({
    callState: state.call,
  }))
  const { user } = useAppSelector((state) => state.auth)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Create peer connection when component mounts
    dispatch(createPeerConnection())

    // Auto end call after 60 minutes
    const timeout = setTimeout(
      () => {
        handleEndCall()
      },
      60 * 60 * 1000,
    )

    return () => {
      clearTimeout(timeout)
      // Clean up call resources when component unmounts
      dispatch(resetCall())
    }
  }, [dispatch])

  // Set call as connected when remote stream is available
  useEffect(() => {
    if (callState.remoteStream && callState.status !== "connected") {
      dispatch(setCallStatus("connected"))
    }
  }, [callState.remoteStream, callState.status, dispatch])

  // Handle call ended state
  useEffect(() => {
    if (callState.status === "ended") {
      router.push("/dashboard?callEnded=true")
    }
  }, [callState.status, router])

  const handleEndCall = () => {
    dispatch(resetCall())
    router.push("/dashboard?callEnded=true")
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex-1 relative">
        <VideoGrid />

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <Card className="bg-slate-800/70 text-white p-3 backdrop-blur-sm">
            <div className="text-sm font-medium">{callState.isVideoCall ? "Video Call" : "Audio Call"}</div>
            {callState.status === "connected" && <CallTimer />}
          </Card>

          {user?.type === "coach" && callState.status === "connected" && <RecordingControls />}
        </div>
      </div>

      <div className="p-4 bg-slate-800">
        <CallControls />
      </div>
    </div>
  )
}

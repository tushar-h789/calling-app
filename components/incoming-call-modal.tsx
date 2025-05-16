"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, PhoneOff, Video } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useRouter } from "next/navigation"
import { setupMedia, setCallStatus, createPeerConnection } from "@/store/slices/callSlice"

export function IncomingCallModal() {
  const dispatch = useAppDispatch()
  const { status, isVideoCall, callId, callerName } = useAppSelector((state) => state.call)
  const { socket } = useAppSelector((state) => state.socket)
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // Play ringtone when there's an incoming call
    if (status === "incoming" && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((err) => console.error("Error playing ringtone:", err))
    }

    // Stop ringtone when call is no longer incoming
    if (status !== "incoming" && audioRef.current) {
      audioRef.current.pause()
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [status])

  const handleAcceptCall = async () => {
    if (!socket || !callId) return

    try {
      // Stop ringtone
      if (audioRef.current) {
        audioRef.current.pause()
      }

      // Setup media
      await dispatch(setupMedia(isVideoCall)).unwrap()

      // Create peer connection
      await dispatch(createPeerConnection()).unwrap()

      // Update call status
      dispatch(setCallStatus("connected"))

      // Navigate to call page
      router.push(`/call/${callId}?type=${isVideoCall ? "video" : "audio"}`)
    } catch (error) {
      console.error("Error accepting call:", error)
    }
  }

  const handleRejectCall = () => {
    if (!socket || !callId) return

    // Stop ringtone
    if (audioRef.current) {
      audioRef.current.pause()
    }

    // Emit reject call event
    socket.emit("rejectCall", { callId })

    // Reset call state
    dispatch(setCallStatus("idle"))
  }

  if (status !== "incoming") {
    return null
  }

  return (
    <>
      <audio ref={audioRef} loop>
        <source src="/ringtone.mp3" type="audio/mp3" />
      </audio>

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Incoming Call</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
              {isVideoCall ? (
                <Video className="h-10 w-10 text-slate-600" />
              ) : (
                <Phone className="h-10 w-10 text-slate-600" />
              )}
            </div>
            <div className="text-center">
              <div className="text-xl font-medium">{callerName || "Unknown Caller"}</div>
              <div className="text-sm text-slate-500">{isVideoCall ? "Video Call" : "Audio Call"}</div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Button variant="destructive" className="rounded-full h-12 w-12 p-0" onClick={handleRejectCall}>
              <PhoneOff className="h-5 w-5" />
              <span className="sr-only">Reject</span>
            </Button>
            <Button
              variant="default"
              className="rounded-full h-12 w-12 p-0 bg-green-500 hover:bg-green-600"
              onClick={handleAcceptCall}
            >
              <Phone className="h-5 w-5" />
              <span className="sr-only">Accept</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}

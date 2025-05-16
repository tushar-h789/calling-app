"use client"

import { Button } from "@/components/ui/button"
import { Mic, MicOff, Phone, Video, VideoOff } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { toggleMicrophone, toggleCamera, resetCall } from "@/store/slices/callSlice"
import { useRouter } from "next/navigation"

export function CallControls() {
  const dispatch = useAppDispatch()
  const { isMicMuted, isCameraOff, isVideoCall } = useAppSelector((state) => state.call)
  const router = useRouter()

  const handleToggleMicrophone = () => {
    dispatch(toggleMicrophone())
  }

  const handleToggleCamera = () => {
    dispatch(toggleCamera())
  }

  const handleEndCall = () => {
    dispatch(resetCall())
    router.push("/dashboard?callEnded=true")
  }

  return (
    <div className="flex justify-center space-x-4">
      <Button
        variant="outline"
        size="lg"
        className={`rounded-full p-3 h-14 w-14 ${
          isMicMuted ? "bg-red-500 text-white hover:bg-red-600" : "bg-slate-700 text-white hover:bg-slate-600"
        }`}
        onClick={handleToggleMicrophone}
      >
        {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        <span className="sr-only">{isMicMuted ? "Unmute Microphone" : "Mute Microphone"}</span>
      </Button>

      {isVideoCall && (
        <Button
          variant="outline"
          size="lg"
          className={`rounded-full p-3 h-14 w-14 ${
            isCameraOff ? "bg-red-500 text-white hover:bg-red-600" : "bg-slate-700 text-white hover:bg-slate-600"
          }`}
          onClick={handleToggleCamera}
        >
          {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          <span className="sr-only">{isCameraOff ? "Turn On Camera" : "Turn Off Camera"}</span>
        </Button>
      )}

      <Button variant="destructive" size="lg" className="rounded-full p-3 h-14 w-14" onClick={handleEndCall}>
        <Phone className="h-6 w-6 rotate-135" />
        <span className="sr-only">End Call</span>
      </Button>
    </div>
  )
}

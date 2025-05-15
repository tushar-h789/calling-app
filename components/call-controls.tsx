"use client"

import { Button } from "@/components/ui/button"
import { Mic, MicOff, Phone, Video, VideoOff } from "lucide-react"
import { useCall } from "@/hooks/use-call"

export function CallControls() {
  const { callState, toggleMicrophone, toggleCamera, endCall } = useCall()

  return (
    <div className="flex justify-center space-x-4">
      <Button
        variant="outline"
        size="lg"
        className={`rounded-full p-3 h-14 w-14 ${
          callState.isMicMuted ? "bg-red-500 text-white hover:bg-red-600" : "bg-slate-700 text-white hover:bg-slate-600"
        }`}
        onClick={toggleMicrophone}
      >
        {callState.isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        <span className="sr-only">{callState.isMicMuted ? "Unmute Microphone" : "Mute Microphone"}</span>
      </Button>

      {callState.isVideoCall && (
        <Button
          variant="outline"
          size="lg"
          className={`rounded-full p-3 h-14 w-14 ${
            callState.isCameraOff
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-slate-700 text-white hover:bg-slate-600"
          }`}
          onClick={toggleCamera}
        >
          {callState.isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          <span className="sr-only">{callState.isCameraOff ? "Turn On Camera" : "Turn Off Camera"}</span>
        </Button>
      )}

      <Button variant="destructive" size="lg" className="rounded-full p-3 h-14 w-14" onClick={endCall}>
        <Phone className="h-6 w-6 rotate-135" />
        <span className="sr-only">End Call</span>
      </Button>
    </div>
  )
}

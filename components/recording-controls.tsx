"use client"

import { Button } from "@/components/ui/button"
import { RepeatIcon as Record, Square } from "lucide-react"
import { useCall } from "@/hooks/use-call"

export function RecordingControls() {
  const { callState, startRecording, stopRecording } = useCall()

  return (
    <Button
      variant={callState.isRecording ? "destructive" : "secondary"}
      size="sm"
      className="flex items-center space-x-1"
      onClick={callState.isRecording ? stopRecording : startRecording}
    >
      {callState.isRecording ? (
        <>
          <Square className="h-4 w-4" />
          <span>Stop Recording</span>
        </>
      ) : (
        <>
          <Record className="h-4 w-4" />
          <span>Start Recording</span>
        </>
      )}
    </Button>
  )
}

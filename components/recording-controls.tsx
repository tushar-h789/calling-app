"use client"

import { Button } from "@/components/ui/button"
import { RepeatIcon as Record, Square } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setIsRecording } from "@/store/slices/callSlice"

export function RecordingControls() {
  const dispatch = useAppDispatch()
  const { isRecording } = useAppSelector((state) => state.call)
  const { socket } = useAppSelector((state) => state.socket)

  const handleToggleRecording = () => {
    if (!socket) return

    if (isRecording) {
      // Stop recording
      // Here you would implement the actual recording stop logic
      // For now, we'll just update the state
      dispatch(setIsRecording(false))
    } else {
      // Start recording
      // Here you would implement the actual recording start logic
      // For now, we'll just update the state
      dispatch(setIsRecording(true))
    }
  }

  return (
    <Button
      variant={isRecording ? "destructive" : "secondary"}
      size="sm"
      className="flex items-center space-x-1"
      onClick={handleToggleRecording}
    >
      {isRecording ? (
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

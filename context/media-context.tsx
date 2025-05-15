"use client"

import { createContext, useState, type ReactNode, useContext } from "react"

interface MediaContextType {
  isCameraEnabled: boolean
  isMicrophoneEnabled: boolean
  toggleCamera: () => void
  toggleMicrophone: () => void
}

const MediaContext = createContext<MediaContextType>({
  isCameraEnabled: true,
  isMicrophoneEnabled: true,
  toggleCamera: () => {},
  toggleMicrophone: () => {},
})

export function MediaProvider({ children }: { children: ReactNode }) {
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true)

  const toggleCamera = () => {
    setIsCameraEnabled((prev) => !prev)
  }

  const toggleMicrophone = () => {
    setIsMicrophoneEnabled((prev) => !prev)
  }

  return (
    <MediaContext.Provider
      value={{
        isCameraEnabled,
        isMicrophoneEnabled,
        toggleCamera,
        toggleMicrophone,
      }}
    >
      {children}
    </MediaContext.Provider>
  )
}

export function useMedia() {
  return useContext(MediaContext)
}

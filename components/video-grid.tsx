"use client"

import { useRef, useEffect } from "react"
import { useAppSelector } from "@/store/hooks"

export function VideoGrid() {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const { localStream, remoteStream, isVideoCall, isCameraOff } = useAppSelector((state) => state.call)

  useEffect(() => {
    // Set local stream
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }

    // Set remote stream
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [localStream, remoteStream])

  return (
    <div className="h-full w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div className={`relative ${!isVideoCall && "hidden"}`}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded-lg bg-slate-800"
          data-remote
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center text-white">Connecting...</div>
        )}
      </div>

      <div className={`relative ${!isVideoCall && "hidden"}`}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-lg bg-slate-700"
          data-local
        />
        {isCameraOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-lg text-white">
            Camera Off
          </div>
        )}
      </div>

      {!isVideoCall && (
        <div className="col-span-2 flex items-center justify-center h-full">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🎧</div>
            <div className="text-xl font-medium">Audio Call</div>
            {remoteStream ? (
              <div className="mt-2 text-slate-400">Call connected</div>
            ) : (
              <div className="mt-2 text-slate-400">Connecting...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

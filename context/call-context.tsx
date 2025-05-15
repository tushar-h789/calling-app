"use client"

import { createContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSocket } from "@/hooks/use-socket"
import { useAuth } from "@/hooks/use-auth"
import type { CallState, InitiateCallParams } from "@/types"

interface CallContextType {
  callState: CallState
  initiateCall: (params: InitiateCallParams) => Promise<string>
  acceptCall: () => Promise<void>
  rejectCall: () => void
  endCall: () => void
  toggleMicrophone: () => void
  toggleCamera: () => void
  startRecording: () => void
  stopRecording: () => void
}

export const CallContext = createContext<CallContextType>({
  callState: {
    status: "idle",
    callId: null,
    isVideoCall: false,
    localStream: null,
    remoteStream: null,
    isMicMuted: false,
    isCameraOff: false,
    isRecording: false,
    callerName: null,
    receiverId: null,
    appointmentId: null,
  },
  initiateCall: async () => "",
  acceptCall: async () => {},
  rejectCall: () => {},
  endCall: () => {},
  toggleMicrophone: () => {},
  toggleCamera: () => {},
  startRecording: () => {},
  stopRecording: () => {},
})

interface CallProviderProps {
  children: ReactNode
  callId?: string
  isVideoCall?: boolean
}

export function CallProvider({
  children,
  callId: initialCallId,
  isVideoCall: initialIsVideoCall = false,
}: CallProviderProps) {
  const [callState, setCallState] = useState<CallState>({
    status: initialCallId ? "connecting" : "idle",
    callId: initialCallId || null,
    isVideoCall: initialIsVideoCall,
    localStream: null,
    remoteStream: null,
    isMicMuted: false,
    isCameraOff: false,
    isRecording: false,
    callerName: null,
    receiverId: null,
    appointmentId: null,
  })

  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const recordingCanvas = useRef<HTMLCanvasElement | null>(null)
  const recordedChunks = useRef<Blob[]>([])
  const recordingId = useRef<string | null>(null)
  const chunkSequence = useRef<number>(0)
  const candidateQueue = useRef<RTCIceCandidate[]>([])
  const remoteDescSet = useRef<boolean>(false)
  const audioContext = useRef<AudioContext | null>(null)
  const dialTone = useRef<HTMLAudioElement | null>(null)

  const { socket, socketId } = useSocket()
  const { user, token } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize from URL params if in call page
  useEffect(() => {
    if (initialCallId) {
      const receiverId = searchParams.get("receiver")
      const appointmentId = searchParams.get("appointment")

      if (receiverId && appointmentId) {
        setCallState((prev) => ({
          ...prev,
          receiverId,
          appointmentId,
        }))

        // Setup media and initiate call
        setupMedia().then(() => {
          if (socketId !== receiverId) {
            // We are the caller
            createPeerConnection()
            createAndSendOffer(receiverId, appointmentId)
          }
        })
      }
    }
  }, [initialCallId, searchParams, socketId])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    // Incoming call
    const handleIncomingCall = async (data: any) => {
      if (data.caller === socketId) return

      // Play ringtone
      if (dialTone.current) {
        dialTone.current.src = "/ringtone.mp3"
        dialTone.current.currentTime = 0
        dialTone.current.play().catch((err) => console.error("Error playing ringtone:", err))
      }

      // Check if call has video
      const hasVideo = data.offer?.sdp?.includes("m=video") || false

      setCallState((prev) => ({
        ...prev,
        status: "incoming",
        callId: data.callId,
        isVideoCall: hasVideo,
        callerName: data.callerName || "Unknown",
        receiverId: data.caller,
        appointmentId: data.appointmentId,
      }))
    }

    // Call accepted
    const handleCallAccepted = async (data: any) => {
      if (!peerConnection.current) return

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer))
      remoteDescSet.current = true

      // Process queued ICE candidates
      while (candidateQueue.current.length > 0) {
        const candidate = candidateQueue.current.shift()
        if (candidate) {
          await peerConnection.current.addIceCandidate(candidate)
        }
      }

      // Stop dial tone
      if (dialTone.current) {
        dialTone.current.pause()
      }

      setCallState((prev) => ({
        ...prev,
        status: "connected",
      }))
    }

    // Call rejected
    const handleCallRejected = () => {
      cleanupCall()
      router.push("/dashboard?callRejected=true")
    }

    // Call ended
    const handleCallEnded = () => {
      cleanupCall()
      router.push("/dashboard?callEnded=true")
    }

    // ICE candidate
    const handleIceCandidate = async (data: any) => {
      if (!peerConnection.current) return

      const candidate = new RTCIceCandidate(data.candidate)

      if (!remoteDescSet.current) {
        candidateQueue.current.push(candidate)
      } else {
        await peerConnection.current.addIceCandidate(candidate)
      }
    }

    // Recording events
    const handleRecordingStarted = () => {
      console.log("Remote party started recording")
    }

    const handleRecordingStopped = () => {
      console.log("Remote party stopped recording")
    }

    // Register event listeners
    socket.on("incomingCall", handleIncomingCall)
    socket.on("callAccepted", handleCallAccepted)
    socket.on("rejectCall", handleCallRejected)
    socket.on("callEnded", handleCallEnded)
    socket.on("iceCandidate", handleIceCandidate)
    socket.on("recordingStarted", handleRecordingStarted)
    socket.on("recordingStopped", handleRecordingStopped)

    // Create audio element for ringtone/dial tone
    dialTone.current = new Audio()

    return () => {
      // Clean up event listeners
      socket.off("incomingCall", handleIncomingCall)
      socket.off("callAccepted", handleCallAccepted)
      socket.off("rejectCall", handleCallRejected)
      socket.off("callEnded", handleCallEnded)
      socket.off("iceCandidate", handleIceCandidate)
      socket.off("recordingStarted", handleRecordingStarted)
      socket.off("recordingStopped", handleRecordingStopped)

      // Clean up call resources
      cleanupCall()
    }
  }, [socket, socketId, router])

  // Setup media streams
  const setupMedia = async () => {
    try {
      const constraints = {
        audio: true,
        video: callState.isVideoCall
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
          : false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      setCallState((prev) => ({
        ...prev,
        localStream: stream,
      }))

      return stream
    } catch (error) {
      console.error("Error setting up media:", error)
      throw error
    }
  }

  // Create WebRTC peer connection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })

    // Add local tracks to peer connection
    if (callState.localStream) {
      callState.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, callState.localStream!)
      })
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && callState.callId && callState.receiverId) {
        socket.emit("iceCandidate", {
          callId: callState.callId,
          candidate: event.candidate,
          to: callState.receiverId,
        })
      }
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      setCallState((prev) => ({
        ...prev,
        remoteStream: event.streams[0],
      }))
    }

    peerConnection.current = pc
  }

  // Create and send offer
  const createAndSendOffer = async (receiverId: string, appointmentId: string) => {
    if (!peerConnection.current || !socket) return

    try {
      const offer = await peerConnection.current.createOffer()
      await peerConnection.current.setLocalDescription(offer)

      // Play dial tone
      if (dialTone.current) {
        dialTone.current.src = "/dialtone.mp3"
        dialTone.current.loop = true
        dialTone.current.currentTime = 0
        dialTone.current.play().catch((err) => console.error("Error playing dial tone:", err))
      }

      socket.emit("call", {
        appointmentId,
        receiver: receiverId,
        offer,
        callerName: user?.name || "Unknown",
      })
    } catch (error) {
      console.error("Error creating offer:", error)
    }
  }

  // Initiate a call
  const initiateCall = async (params: InitiateCallParams): Promise<string> => {
    if (!socket || !socketId) {
      throw new Error("Socket not connected")
    }

    const { receiverId, appointmentId, isVideoCall } = params
    const newCallId = `${appointmentId}-${Date.now()}`

    setCallState((prev) => ({
      ...prev,
      status: "connecting",
      callId: newCallId,
      isVideoCall: isVideoCall || false,
      receiverId,
      appointmentId,
    }))

    return newCallId
  }

  // Accept incoming call
  const acceptCall = async () => {
    if (!socket || !callState.callId || !callState.receiverId) return

    try {
      // Stop ringtone
      if (dialTone.current) {
        dialTone.current.pause()
      }

      // Setup media
      await setupMedia()

      // Create peer connection
      createPeerConnection()

      // Get the offer from the caller
      const offerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/call/offer/${callState.callId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const offerData = await offerRes.json()

      if (!offerData.success || !offerData.offer) {
        throw new Error("Failed to get call offer")
      }

      // Set remote description (the offer)
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offerData.offer))
        remoteDescSet.current = true

        // Create answer
        const answer = await peerConnection.current.createAnswer()
        await peerConnection.current.setLocalDescription(answer)

        // Send answer to caller
        socket.emit("answer", {
          callId: callState.callId,
          caller: callState.receiverId,
          appointmentId: callState.appointmentId,
          answer,
        })

        // Process queued ICE candidates
        while (candidateQueue.current.length > 0) {
          const candidate = candidateQueue.current.shift()
          if (candidate) {
            await peerConnection.current.addIceCandidate(candidate)
          }
        }

        setCallState((prev) => ({
          ...prev,
          status: "connected",
        }))
      }
    } catch (error) {
      console.error("Error accepting call:", error)
      cleanupCall()
    }
  }

  // Reject incoming call
  const rejectCall = () => {
    if (!socket || !callState.callId) return

    // Stop ringtone
    if (dialTone.current) {
      dialTone.current.pause()
    }

    socket.emit("rejectCall", { callId: callState.callId })

    setCallState((prev) => ({
      ...prev,
      status: "idle",
      callId: null,
      callerName: null,
      receiverId: null,
      appointmentId: null,
    }))
  }

  // End active call
  const endCall = () => {
    if (!socket || !callState.callId) return

    // Stop recording if active
    if (callState.isRecording) {
      stopRecording()
    }

    // Emit end call event
    socket.emit("endCall", {
      callId: callState.callId,
      receiver: callState.receiverId,
      appointmentId: callState.appointmentId,
    })

    cleanupCall()

    // Navigate back to dashboard
    router.push("/dashboard?callEnded=true")
  }

  // Toggle microphone mute state
  const toggleMicrophone = () => {
    if (!callState.localStream) return

    const audioTracks = callState.localStream.getAudioTracks()

    if (audioTracks.length > 0) {
      const isMuted = !callState.isMicMuted
      audioTracks[0].enabled = !isMuted

      setCallState((prev) => ({
        ...prev,
        isMicMuted: isMuted,
      }))
    }
  }

  // Toggle camera on/off state
  const toggleCamera = () => {
    if (!callState.localStream || !callState.isVideoCall) return

    const videoTracks = callState.localStream.getVideoTracks()

    if (videoTracks.length > 0) {
      const isCameraOff = !callState.isCameraOff
      videoTracks[0].enabled = !isCameraOff

      setCallState((prev) => ({
        ...prev,
        isCameraOff,
      }))
    }
  }

  // Start call recording
  const startRecording = () => {
    if (!callState.localStream || !callState.remoteStream || callState.isRecording) return

    try {
      // Check browser support
      const mimeTypes = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"]

      const supportedType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type))

      if (!supportedType) {
        console.error("No supported video recording format found")
        return
      }

      // Create canvas for recording
      if (!recordingCanvas.current) {
        recordingCanvas.current = document.createElement("canvas")
        recordingCanvas.current.width = 1280
        recordingCanvas.current.height = 720
        recordingCanvas.current.style.display = "none"
        document.body.appendChild(recordingCanvas.current)
      }

      const canvas = recordingCanvas.current
      const canvasContext = canvas.getContext("2d")

      if (!canvasContext) {
        throw new Error("Could not get canvas context")
      }

      // Generate unique recording ID
      recordingId.current = crypto.randomUUID()
      chunkSequence.current = 0
      recordedChunks.current = []

      // Create audio context for mixing
      audioContext.current = new AudioContext()
      const destination = audioContext.current.createMediaStreamDestination()

      // Add local audio
      if (callState.localStream) {
        const localAudioSource = audioContext.current.createMediaStreamSource(callState.localStream)
        localAudioSource.connect(destination)
      }

      // Add remote audio
      if (callState.remoteStream) {
        const remoteAudioSource = audioContext.current.createMediaStreamSource(callState.remoteStream)
        remoteAudioSource.connect(destination)
      }

      // Setup canvas recording
      const canvasStream = canvas.captureStream(30) // 30 FPS

      // Draw frames function
      const drawFrame = () => {
        if (!canvasContext || !canvas) return

        canvasContext.clearRect(0, 0, canvas.width, canvas.height)
        const halfWidth = canvas.width / 2
        const height = canvas.height

        // Draw remote video on left side
        const remoteVideo = document.querySelector("video[data-remote]") as HTMLVideoElement
        if (remoteVideo && remoteVideo.readyState >= 2) {
          canvasContext.drawImage(remoteVideo, 0, 0, halfWidth, height)
        }

        // Draw local video on right side
        const localVideo = document.querySelector("video[data-local]") as HTMLVideoElement
        if (localVideo && localVideo.readyState >= 2) {
          canvasContext.drawImage(localVideo, halfWidth, 0, halfWidth, height)
        }

        // Continue drawing frames if recording
        if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
          requestAnimationFrame(drawFrame)
        }
      }

      // Combine video (canvas) + audio into one stream
      const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...destination.stream.getAudioTracks()])

      // Create MediaRecorder
      mediaRecorder.current = new MediaRecorder(combinedStream, {
        mimeType: supportedType,
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: callState.isVideoCall ? 2500000 : undefined,
      })

      // Handle data available event
      mediaRecorder.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data)

          // Send chunk to server
          if (socket && recordingId.current && callState.appointmentId) {
            const arrayBuffer = await event.data.arrayBuffer()
            const chunk = Array.from(new Uint8Array(arrayBuffer))

            socket.emit("recordingChunk", {
              recordingId: recordingId.current,
              sequence: chunkSequence.current++,
              chunk,
              appointmentId: callState.appointmentId,
            })
          }
        }
      }

      // Handle recording stop
      mediaRecorder.current.onstop = () => {
        // Notify server that recording has ended
        if (socket && recordingId.current && callState.appointmentId) {
          socket.emit("recordingEnded", {
            recordingId: recordingId.current,
            appointmentId: callState.appointmentId,
          })
        }

        // Create downloadable file
        const blob = new Blob(recordedChunks.current, { type: supportedType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `recording_${new Date().toISOString()}.webm`
        a.click()
        URL.revokeObjectURL(url)

        // Cleanup
        if (audioContext.current) {
          audioContext.current.close()
          audioContext.current = null
        }

        setCallState((prev) => ({
          ...prev,
          isRecording: false,
        }))
      }

      // Start recording with 1-second chunks
      mediaRecorder.current.start(1000)

      // Start drawing frames
      drawFrame()

      // Notify other participant
      if (socket && callState.receiverId && callState.appointmentId) {
        socket.emit("recordingStarted", {
          appointmentId: callState.appointmentId,
          receiver: callState.receiverId,
        })
      }

      setCallState((prev) => ({
        ...prev,
        isRecording: true,
      }))
    } catch (error) {
      console.error("Failed to start recording:", error)
    }
  }

  // Stop call recording
  const stopRecording = () => {
    if (!mediaRecorder.current || !callState.isRecording) return

    try {
      mediaRecorder.current.stop()

      // Notify other participant
      if (socket && callState.receiverId && callState.appointmentId) {
        socket.emit("recordingStopped", {
          appointmentId: callState.appointmentId,
          receiver: callState.receiverId,
        })
      }
    } catch (error) {
      console.error("Error stopping recording:", error)
    }
  }

  // Clean up call resources
  const cleanupCall = () => {
    // Stop recording if active
    if (mediaRecorder.current && callState.isRecording) {
      mediaRecorder.current.stop()
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }

    // Stop all tracks in local stream
    if (callState.localStream) {
      callState.localStream.getTracks().forEach((track) => track.stop())
    }

    // Reset state
    setCallState({
      status: "idle",
      callId: null,
      isVideoCall: false,
      localStream: null,
      remoteStream: null,
      isMicMuted: false,
      isCameraOff: false,
      isRecording: false,
      callerName: null,
      receiverId: null,
      appointmentId: null,
    })

    // Reset refs
    remoteDescSet.current = false
    candidateQueue.current = []
    recordingId.current = null
    chunkSequence.current = 0
    recordedChunks.current = []

    // Close audio context
    if (audioContext.current) {
      audioContext.current.close()
      audioContext.current = null
    }

    // Remove canvas if it exists
    if (recordingCanvas.current) {
      document.body.removeChild(recordingCanvas.current)
      recordingCanvas.current = null
    }
  }

  return (
    <CallContext.Provider
      value={{
        callState,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMicrophone,
        toggleCamera,
        startRecording,
        stopRecording,
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

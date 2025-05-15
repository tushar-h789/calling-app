export interface User {
    id: string
    name: string
    email: string
    type: string
    avatar: string | null
  }
  
  export interface Contact {
    id: string
    name: string
    email: string
    appointmentId: string
    type: string
    avatar: string | null
  }
  
  export interface CallHistoryItem {
    id: string
    contactName: string
    contactEmail: string
    timestamp: string
    duration: number
    type: "audio" | "video"
    status: "completed" | "missed" | "rejected"
  }
  
  export interface MissedCall {
    id: string
    callerId: string
    appointmentId: string
    timestamp: string
    isDoctorCall: boolean
    message: string
  }
  
  export interface CallState {
    status: "idle" | "connecting" | "connected" | "incoming" | "ended"
    callId: string | null
    isVideoCall: boolean
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    isMicMuted: boolean
    isCameraOff: boolean
    isRecording: boolean
    callerName: string | null
    receiverId: string | null
    appointmentId: string | null
  }
  
  export interface InitiateCallParams {
    receiverId: string
    appointmentId: string
    isVideoCall?: boolean
  }
  
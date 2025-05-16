import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { CallState, InitiateCallParams } from "@/types"
import type { RootState } from "../index"

const initialState: CallState = {
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
}

// Async thunks
export const setupMedia = createAsyncThunk("call/setupMedia", async (isVideoCall: boolean, { rejectWithValue }) => {
  try {
    const constraints = {
      audio: true,
      video: isVideoCall
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
        : false,
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    return stream
  } catch (error) {
    console.error("Error setting up media:", error)
    return rejectWithValue((error as Error).message || "Failed to access media devices")
  }
})

export const initiateCall = createAsyncThunk(
  "call/initiateCall",
  async (params: InitiateCallParams, { getState, dispatch, rejectWithValue }) => {
    const { receiverId, appointmentId, isVideoCall = false } = params
    const state = getState() as RootState
    const { socket } = state.socket

    if (!socket) {
      return rejectWithValue("Socket not connected")
    }

    try {
      // Setup media first
      await dispatch(setupMedia(isVideoCall)).unwrap()

      // Generate call ID
      const callId = `${appointmentId}-${Date.now()}`

      return {
        callId,
        receiverId,
        appointmentId,
        isVideoCall,
      }
    } catch (error) {
      return rejectWithValue((error as Error).message || "Failed to initiate call")
    }
  },
)

export const createPeerConnection = createAsyncThunk(
  "call/createPeerConnection",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const { localStream } = state.call
      const { socket, socketId } = state.socket
      const { callId, receiverId } = state.call

      if (!socket || !socketId) {
        return rejectWithValue("Socket not connected")
      }

      if (!localStream) {
        return rejectWithValue("Local stream not available")
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      })

      // Add local tracks to peer connection
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream)
      })

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && callId && receiverId) {
          socket.emit("iceCandidate", {
            callId,
            candidate: event.candidate,
            to: receiverId,
          })
        }
      }

      // Handle remote tracks
      pc.ontrack = (event) => {
        dispatch(setRemoteStream(event.streams[0]))
      }

      return pc
    } catch (error) {
      return rejectWithValue((error as Error).message || "Failed to create peer connection")
    }
  },
)

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    setCallStatus: (state, action: PayloadAction<CallState["status"]>) => {
      state.status = action.payload
    },
    setCallId: (state, action: PayloadAction<string | null>) => {
      state.callId = action.payload
    },
    setIsVideoCall: (state, action: PayloadAction<boolean>) => {
      state.isVideoCall = action.payload
    },
    setLocalStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.localStream = action.payload
    },
    setRemoteStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.remoteStream = action.payload
    },
    setIsMicMuted: (state, action: PayloadAction<boolean>) => {
      state.isMicMuted = action.payload

      // Update the actual audio track if available
      if (state.localStream) {
        const audioTracks = state.localStream.getAudioTracks()
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = !action.payload
        }
      }
    },
    setIsCameraOff: (state, action: PayloadAction<boolean>) => {
      state.isCameraOff = action.payload

      // Update the actual video track if available
      if (state.localStream) {
        const videoTracks = state.localStream.getVideoTracks()
        if (videoTracks.length > 0) {
          videoTracks[0].enabled = !action.payload
        }
      }
    },
    setIsRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload
    },
    setCallerInfo: (
      state,
      action: PayloadAction<{ callerName: string | null; receiverId: string | null; appointmentId: string | null }>,
    ) => {
      state.callerName = action.payload.callerName
      state.receiverId = action.payload.receiverId
      state.appointmentId = action.payload.appointmentId
    },
    resetCall: (state) => {
      // Stop all tracks in local stream
      if (state.localStream) {
        state.localStream.getTracks().forEach((track) => track.stop())
      }

      // Reset to initial state but preserve isVideoCall preference
      const isVideoCall = state.isVideoCall
      Object.assign(state, { ...initialState, isVideoCall })
    },
    toggleMicrophone: (state) => {
      state.isMicMuted = !state.isMicMuted

      if (state.localStream) {
        const audioTracks = state.localStream.getAudioTracks()
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = !state.isMicMuted
        }
      }
    },
    toggleCamera: (state) => {
      state.isCameraOff = !state.isCameraOff

      if (state.localStream) {
        const videoTracks = state.localStream.getVideoTracks()
        if (videoTracks.length > 0) {
          videoTracks[0].enabled = !state.isCameraOff
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setupMedia.fulfilled, (state, action) => {
        state.localStream = action.payload
      })
      .addCase(initiateCall.fulfilled, (state, action) => {
        state.status = "connecting"
        state.callId = action.payload.callId
        state.isVideoCall = action.payload.isVideoCall
        state.receiverId = action.payload.receiverId
        state.appointmentId = action.payload.appointmentId
      })
      .addCase(initiateCall.rejected, (state) => {
        state.status = "idle"
      })
  },
})

export const {
  setCallStatus,
  setCallId,
  setIsVideoCall,
  setLocalStream,
  setRemoteStream,
  setIsMicMuted,
  setIsCameraOff,
  setIsRecording,
  setCallerInfo,
  resetCall,
  toggleMicrophone,
  toggleCamera,
} = callSlice.actions

export default callSlice.reducer

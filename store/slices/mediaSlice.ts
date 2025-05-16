import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface MediaState {
  isCameraEnabled: boolean
  isMicrophoneEnabled: boolean
  availableDevices: {
    audioInputs: MediaDeviceInfo[]
    videoInputs: MediaDeviceInfo[]
    audioOutputs: MediaDeviceInfo[]
  }
  selectedDevices: {
    audioInput: string | null
    videoInput: string | null
    audioOutput: string | null
  }
}

const initialState: MediaState = {
  isCameraEnabled: true,
  isMicrophoneEnabled: true,
  availableDevices: {
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  },
  selectedDevices: {
    audioInput: null,
    videoInput: null,
    audioOutput: null,
  },
}

const mediaSlice = createSlice({
  name: "media",
  initialState,
  reducers: {
    setIsCameraEnabled: (state, action: PayloadAction<boolean>) => {
      state.isCameraEnabled = action.payload
    },
    setIsMicrophoneEnabled: (state, action: PayloadAction<boolean>) => {
      state.isMicrophoneEnabled = action.payload
    },
    setAvailableDevices: (state, action: PayloadAction<MediaDeviceInfo[]>) => {
      const devices = action.payload

      state.availableDevices = {
        audioInputs: devices.filter((device) => device.kind === "audioinput"),
        videoInputs: devices.filter((device) => device.kind === "videoinput"),
        audioOutputs: devices.filter((device) => device.kind === "audiooutput"),
      }
    },
    setSelectedAudioInput: (state, action: PayloadAction<string | null>) => {
      state.selectedDevices.audioInput = action.payload
    },
    setSelectedVideoInput: (state, action: PayloadAction<string | null>) => {
      state.selectedDevices.videoInput = action.payload
    },
    setSelectedAudioOutput: (state, action: PayloadAction<string | null>) => {
      state.selectedDevices.audioOutput = action.payload
    },
    toggleCamera: (state) => {
      state.isCameraEnabled = !state.isCameraEnabled
    },
    toggleMicrophone: (state) => {
      state.isMicrophoneEnabled = !state.isMicrophoneEnabled
    },
  },
})

export const {
  setIsCameraEnabled,
  setIsMicrophoneEnabled,
  setAvailableDevices,
  setSelectedAudioInput,
  setSelectedVideoInput,
  setSelectedAudioOutput,
  toggleCamera,
  toggleMicrophone,
} = mediaSlice.actions

export default mediaSlice.reducer

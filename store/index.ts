import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import socketReducer from "./slices/socketSlice"
import callReducer from "./slices/callSlice"
import mediaReducer from "./slices/mediaSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    socket: socketReducer,
    call: callReducer,
    media: mediaReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["call/setLocalStream", "call/setRemoteStream", "socket/setSocket", "call/addIceCandidate"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload.stream", "payload.socket", "payload.candidate"],
        // Ignore these paths in the state
        ignoredPaths: ["call.localStream", "call.remoteStream", "socket.socket"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

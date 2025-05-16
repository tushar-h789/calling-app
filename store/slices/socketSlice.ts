import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { io, type Socket } from "socket.io-client"
import type { MissedCall } from "@/types"

interface SocketState {
  socket: Socket | null
  socketId: string | null
  missedCalls: MissedCall[]
  isConnected: boolean
}

const initialState: SocketState = {
  socket: null,
  socketId: null,
  missedCalls: [],
  isConnected: false,
}

export const connectSocket = createAsyncThunk(
  "socket/connect",
  async (token: string, { dispatch, rejectWithValue }) => {
    try {
      const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "", {
        auth: { token },
      })

      // Return the socket ID once connected
      return new Promise<string>((resolve, reject) => {
        socketInstance.on("connect", () => {
          dispatch(setSocket(socketInstance))
          resolve(socketInstance.id)
        })

        socketInstance.on("connect_error", (error) => {
          reject(error.message)
        })

        // Set a timeout in case the connection takes too long
        setTimeout(() => {
          reject("Connection timeout")
        }, 10000)
      })
    } catch (error) {
      return rejectWithValue((error as Error).message || "Failed to connect socket")
    }
  },
)

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setSocket: (state, action: PayloadAction<Socket | null>) => {
      state.socket = action.payload
      state.isConnected = !!action.payload
    },
    setSocketId: (state, action: PayloadAction<string | null>) => {
      state.socketId = action.payload
    },
    addMissedCall: (state, action: PayloadAction<MissedCall>) => {
      state.missedCalls.push(action.payload)
    },
    clearMissedCall: (state, action: PayloadAction<string>) => {
      state.missedCalls = state.missedCalls.filter((call) => call.id !== action.payload)
    },
    disconnectSocket: (state) => {
      if (state.socket) {
        state.socket.disconnect()
      }
      state.socket = null
      state.socketId = null
      state.isConnected = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectSocket.fulfilled, (state, action) => {
        state.socketId = action.payload
        state.isConnected = true
      })
      .addCase(connectSocket.rejected, (state) => {
        state.socket = null
        state.socketId = null
        state.isConnected = false
      })
  },
})

export const { setSocket, setSocketId, addMissedCall, clearMissedCall, disconnectSocket } = socketSlice.actions

export default socketSlice.reducer

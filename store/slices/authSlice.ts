import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "@/types"

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  status: "idle",
  error: null,
}

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!data.success) {
        return rejectWithValue(data.message || "Login failed")
      }

      const authToken = data.authorization.token

      // Save token to localStorage
      localStorage.setItem("token", authToken)
      localStorage.setItem("userEmail", email)

      return { token: authToken }
    } catch (error) {
      return rejectWithValue((error as Error).message || "Login failed")
    }
  },
)

export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (token: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const result = await res.json()

      if (!result.data) {
        return rejectWithValue("Failed to fetch user profile")
      }

      return {
        id: result.data.id,
        name: result.data.name,
        email: result.data.email,
        type: result.data.type,
        avatar: result.data.avatar_url || null,
      } as User
    } catch (error) {
      return rejectWithValue((error as Error).message || "Failed to fetch user profile")
    }
  },
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload
      state.isAuthenticated = !!action.payload
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
    },
    logout: (state) => {
      // Clear localStorage
      localStorage.removeItem("token")
      localStorage.removeItem("userEmail")

      // Reset state
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.status = "idle"
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.user = action.payload
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
      })
  },
})

export const { setToken, setUser, logout } = authSlice.actions

export default authSlice.reducer

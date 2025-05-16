"use client"

import type React from "react"

import { Provider } from "react-redux"
import { useEffect } from "react"
import { setToken, fetchUserProfile } from "@/store/slices/authSlice"
import { connectSocket } from "@/store/slices/socketSlice"
import { IncomingCallModal } from "./incoming-call-modal"
import { store } from "@/store"

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize the store with data from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token")

    if (savedToken) {
      // Dispatch actions to initialize the store
      store.dispatch(setToken(savedToken))
      store.dispatch(fetchUserProfile(savedToken))
      store.dispatch(connectSocket(savedToken))
    }
  }, [])

  return (
    <Provider store={store}>
      {children}
      <IncomingCallModal />
    </Provider>
  )
}

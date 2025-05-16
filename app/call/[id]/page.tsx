"use client"

import { useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { CallUI } from "@/components/call-ui"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setCallerInfo, setCallId, setIsVideoCall } from "@/store/slices/callSlice"

export default function CallPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const isVideoCall = searchParams.get("type") === "video"
  const receiverId = searchParams.get("receiver")
  const appointmentId = searchParams.get("appointment")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const { socket } = useAppSelector((state) => state.socket)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    if (!socket) {
      router.push("/dashboard")
      return
    }

    // Initialize call state from URL params
    dispatch(setCallId(id))
    dispatch(setIsVideoCall(isVideoCall))

    if (receiverId && appointmentId) {
      dispatch(
        setCallerInfo({
          callerName: null, // We don't have this info from URL params
          receiverId,
          appointmentId,
        }),
      )
    }

    // Handle call timeout (auto end after 60 minutes)
    const timeout = setTimeout(
      () => {
        router.push("/dashboard?callEnded=timeout")
      },
      60 * 60 * 1000,
    )

    return () => clearTimeout(timeout)
  }, [isAuthenticated, router, socket, id, isVideoCall, receiverId, appointmentId, dispatch])

  if (!isAuthenticated) {
    return null
  }

  return <CallUI />
}

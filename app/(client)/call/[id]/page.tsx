"use client"

import { useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useSocket } from "@/hooks/use-socket"
import { MediaProvider } from "@/context/media-context"
import { CallProvider } from "@/context/call-context"
import { CallUI } from "@/components/call-ui"


export default function CallPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const isVideoCall = searchParams.get("type") === "video"
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }

    if (!socket) {
      router.push("/dashboard")
    }

    // Handle call timeout (auto end after 60 minutes)
    const timeout = setTimeout(
      () => {
        router.push("/dashboard?callEnded=timeout")
      },
      60 * 60 * 1000,
    )

    return () => clearTimeout(timeout)
  }, [isAuthenticated, router, socket])

  if (!isAuthenticated) {
    return null
  }

  return (
    <MediaProvider>
      <CallProvider callId={id} isVideoCall={isVideoCall}>
        <CallUI />
      </CallProvider>
    </MediaProvider>
  )
}

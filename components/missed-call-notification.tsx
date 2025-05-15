"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { PhoneCall, X } from "lucide-react"
import type { MissedCall } from "@/types"
import { useCall } from "@/hooks/use-call"

interface MissedCallNotificationProps {
  missedCall: MissedCall
  onDismiss: () => void
}

export function MissedCallNotification({ missedCall, onDismiss }: MissedCallNotificationProps) {
  const [isCallbackLoading, setIsCallbackLoading] = useState(false)
  const { initiateCall } = useCall()
  const router = useRouter()

  const handleCallback = async () => {
    setIsCallbackLoading(true)

    try {
      // Initiate a call back to the caller
      const callId = await initiateCall({
        receiverId: missedCall.callerId,
        appointmentId: missedCall.appointmentId,
        isVideoCall: false,
      })

      // Navigate to the call page
      router.push(`/call/${callId}?type=audio`)
    } catch (error) {
      console.error("Error initiating callback:", error)
    } finally {
      setIsCallbackLoading(false)
      onDismiss()
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-full">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Missed Call</h4>
              <p className="text-sm text-slate-500">
                You missed a call from your {missedCall.isDoctorCall ? "doctor" : "patient"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onDismiss}>
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleCallback} disabled={isCallbackLoading}>
          {isCallbackLoading ? "Calling back..." : "Call Back"}
        </Button>
      </CardFooter>
    </Card>
  )
}

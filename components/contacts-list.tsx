"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, Video } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { initiateCall } from "@/store/slices/callSlice"
import type { Contact } from "@/types"
import { toast } from "sonner"

export function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [callingContact, setCallingContact] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const { user, token } = useAppSelector((state) => state.auth)
  const { socket, isConnected } = useAppSelector((state) => state.socket) // Added isConnected
  const router = useRouter()

  useEffect(() => {
    const fetchContacts = async () => {
      if (!token) return

      try {
        const endpoint =
          user?.type === "user" ? "/api/user-dashboard/all-hired-coachs" : "/api/coach-dashboard/all-consumer-list"

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/user`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const result = await res.json()
        const usersData = await usersRes.json()

        const items = user?.type === "user" ? result.coachesList : result.customerlist
        const allUsers = usersData.data

        const mappedContacts = items
          .map((item: any) => {
            const name = user?.type === "user" ? item.name : item.customer_name
            const email = user?.type === "user" ? item.email : null
            const match = allUsers.find((u: any) => (email ? u.email === email : u.name === name))

            if (!match) return null

            return {
              id: match.id,
              name,
              email: match.email,
              appointmentId: item.orderId,
              type: match.type,
              avatar: match.avatar_url || null,
            }
          })
          .filter(Boolean)

        setContacts(mappedContacts)
      } catch (error) {
        console.error("Error fetching contacts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContacts()
  }, [token, user])

  const handleInitiateCall = async (contact: Contact, isVideo: boolean) => {
    if (!socket || !isConnected) {
      toast.error("Socket not connected")
      return
    }

    try {
      setCallingContact(contact.id)
      
      // First initiate the call
      const resultAction = await dispatch(
        initiateCall({
          receiverId: contact.id,
          appointmentId: contact.appointmentId,
          isVideoCall: isVideo,
        })
      ).unwrap()

      // Emit call request to receiver
      socket.emit("incoming-call", {
        callId: resultAction.callId,
        caller: socket.id,
        callerName: user?.name,
        receiver: contact.id,
        appointmentId: contact.appointmentId,
        isVideoCall: isVideo
      })

      // Navigate to call page
      router.push(
        `/call/${resultAction.callId}?type=${isVideo ? "video" : "audio"}&receiver=${contact.id}&appointment=${contact.appointmentId}`
      )

      // Set timeout for call not answered
      setTimeout(() => {
        if (callingContact === contact.id) {
          toast.error("Call not answered")
          setCallingContact(null)
          socket.emit("call-timeout", {
            callId: resultAction.callId,
            receiver: contact.id
          })
        }
      }, 30000) // 30 seconds timeout

    } catch (error) {
      console.error("Failed to initiate call:", error)
      toast.error("Failed to initiate call")
      setCallingContact(null)
    }
}

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading contacts...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-4 text-slate-500">No contacts found</div>
        ) : (
          <ul className="space-y-3">
            {contacts.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={contact.avatar || undefined} />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-slate-500">{contact.email}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleInitiateCall(contact, false)}>
                    <Phone className="h-4 w-4 mr-1" />
                    Audio
                  </Button>
                  <Button size="sm" onClick={() => handleInitiateCall(contact, true)}>
                    <Video className="h-4 w-4 mr-1" />
                    Video
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

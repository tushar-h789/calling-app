"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Video } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSocket } from "@/hooks/use-socket"
import type { Contact } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { Button } from "./ui/button"

export function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, token } = useAuth()
  const { socket } = useSocket()
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

  const initiateCall = (contact: Contact, isVideo: boolean) => {
    if (!socket) return

    const callId = `${contact.appointmentId}-${Date.now()}`

    // Navigate to call page
    router.push(
      `/call/${callId}?type=${isVideo ? "video" : "audio"}&receiver=${contact.id}&appointment=${contact.appointmentId}`,
    )
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
                  <Button size="sm" variant="outline" onClick={() => initiateCall(contact, false)}>
                    <Phone className="h-4 w-4 mr-1" />
                    Audio
                  </Button>
                  <Button size="sm" onClick={() => initiateCall(contact, true)}>
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

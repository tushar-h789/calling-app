"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"

export function UserProfile() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback className="text-2xl">{user.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h3 className="text-xl font-medium">{user.name}</h3>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-full text-sm capitalize">{user.type}</div>
        </div>
      </CardContent>
    </Card>
  )
}

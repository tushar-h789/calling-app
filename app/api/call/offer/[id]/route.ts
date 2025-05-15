import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const callId = params.id
  const token = cookies().get("token")?.value

  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch call offer from your backend
    const response = await fetch(`${process.env.API_URL}/api/call/offer/${callId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching call offer:", error)

    return NextResponse.json({ success: false, message: "Failed to fetch call offer" }, { status: 500 })
  }
}

"use client"

import { useState, useEffect } from "react"
import { useAppSelector } from "@/store/hooks"

export function CallTimer() {
  const [seconds, setSeconds] = useState(0)
  const { status } = useAppSelector((state) => state.call)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (status === "connected") {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const pad = (num: number) => num.toString().padStart(2, "0")

    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
  }

  return <div className="text-sm font-mono mt-1">{formatTime(seconds)}</div>
}

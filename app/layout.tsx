import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Real-Time Calling App",
  description: "A Next.js application for real-time audio and video calls",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>

        <Providers>
          {children}
          <Toaster />
        </Providers>

      </body>
    </html>
  )
}

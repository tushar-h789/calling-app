import type React from "react";
import { Inter } from "next/font/google";
import { SocketProvider } from "@/context/socket-context";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth.context";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Real-Time Calling App",
  description: "A Next.js application for real-time audio and video calls",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange> */}
        <AuthProvider>
          <SocketProvider>
            <Toaster />
            {children}
            <Toaster />
          </SocketProvider>
        </AuthProvider>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}

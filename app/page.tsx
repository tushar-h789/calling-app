import { LoginForm } from "@/components/login-form"
import { Logo } from "@/components/logo"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="flex flex-col items-center space-y-2">
          <Logo className="h-12 w-12" />
          <h1 className="text-2xl font-bold">Real-Time Calling App</h1>
          <p className="text-sm text-slate-500">Sign in to start making calls</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

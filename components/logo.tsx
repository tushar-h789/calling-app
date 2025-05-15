import { Phone } from "lucide-react"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`bg-slate-900 text-white p-2 rounded-lg ${className}`}>
      <Phone className="h-full w-full" />
    </div>
  )
}

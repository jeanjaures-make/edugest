import { GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { icon: "h-6 w-6", container: "h-8 w-8", text: "text-base" },
  md: { icon: "h-7 w-7", container: "h-9 w-9", text: "text-lg" },
  lg: { icon: "h-8 w-8", container: "h-10 w-10", text: "text-xl" },
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const s = sizes[size]

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm ${s.container}`}>
        <GraduationCap className={`${s.icon} text-white`} />
      </div>
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${s.text}`}>
          EduGest CI
        </span>
      )}
    </div>
  )
}

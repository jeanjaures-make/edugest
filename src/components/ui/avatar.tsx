import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />
  )
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, React.ComponentProps<typeof Image>>(
  ({ className, alt, ...props }, ref) => (
    <div className="relative h-full w-full">
      <Image ref={ref} alt={alt || ""} className={cn("object-cover", className)} fill sizes="40px" {...props} />
    </div>
  )
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600", className)} {...props} />
  )
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        danger: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
        orange: "bg-orange-100 text-orange-800",
        purple: "bg-purple-100 text-purple-800",
        gradient: "bg-gradient-to-r from-primary to-accent text-white",
        outline: "border border-border text-foreground bg-transparent",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
      dot: {
        true: "relative pl-5 before:absolute before:left-2 before:top-1/2 before:-translate-y-1/2 before:h-1.5 before:w-1.5 before:rounded-full",
      },
    },
    compoundVariants: [
      { variant: "success", dot: true, className: "before:bg-green-500" },
      { variant: "warning", dot: true, className: "before:bg-yellow-500" },
      { variant: "danger", dot: true, className: "before:bg-red-500" },
      { variant: "info", dot: true, className: "before:bg-blue-500" },
      { variant: "default", dot: true, className: "before:bg-gray-500" },
      { variant: "orange", dot: true, className: "before:bg-orange-500" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, dot, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size, dot }), className)} {...props} />
}

export { Badge, badgeVariants }

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md active:scale-[0.97]",
        destructive:
          "bg-danger text-white hover:bg-red-700 shadow-sm hover:shadow-md active:scale-[0.97]",
        outline:
          "border border-border bg-white hover:bg-muted hover:text-foreground active:scale-[0.97]",
        secondary:
          "bg-muted text-foreground hover:bg-gray-200 active:scale-[0.97]",
        ghost:
          "hover:bg-muted hover:text-foreground active:scale-[0.97]",
        link:
          "text-primary underline-offset-4 hover:underline",
        orange:
          "bg-secondary text-white hover:bg-orange-600 shadow-sm hover:shadow-md active:scale-[0.97]",
        gradient:
          "bg-gradient-to-r from-primary to-accent text-white shadow-sm hover:shadow-md hover:shadow-primary/25 active:scale-[0.97]",
        glow:
          "bg-primary text-white shadow-lg shadow-primary/40 hover:shadow-primary/60 active:scale-[0.97] animate-pulse-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

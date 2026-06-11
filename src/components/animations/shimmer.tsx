import { cn } from "@/lib/utils"

interface ShimmerProps {
  className?: string
  children?: React.ReactNode
}

export function Shimmer({ className, children }: ShimmerProps) {
  if (children) {
    return (
      <span className={cn("relative inline-block overflow-hidden", className)}>
        {children}
        <span className="absolute inset-0 animate-shimmer" />
      </span>
    )
  }

  return <div className={cn("animate-shimmer rounded-lg", className)} />
}

export function ShimmerCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-white p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-8 w-32" />
          <Shimmer className="h-3 w-20" />
        </div>
        <Shimmer className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  )
}

export function ShimmerTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Shimmer className="h-5 flex-1" />
          <Shimmer className="h-5 w-24" />
          <Shimmer className="h-5 w-20" />
          <Shimmer className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

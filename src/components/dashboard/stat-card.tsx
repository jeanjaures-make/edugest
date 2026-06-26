"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { CountUp } from "@/components/animations/count-up"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  className?: string
  gradient?: "blue" | "green" | "orange" | "purple" | "red"
  delay?: number
}

const gradients = {
  blue: {
    card: "bg-gradient-to-br from-blue-600 to-blue-700 text-white",
    icon: "bg-white/20 text-white",
    trend: "text-blue-100",
  },
  green: {
    card: "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white",
    icon: "bg-white/20 text-white",
    trend: "text-emerald-100",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
    icon: "bg-white/20 text-white",
    trend: "text-orange-100",
  },
  purple: {
    card: "bg-gradient-to-br from-violet-600 to-violet-700 text-white",
    icon: "bg-white/20 text-white",
    trend: "text-violet-100",
  },
  red: {
    card: "bg-gradient-to-br from-red-600 to-red-700 text-white",
    icon: "bg-white/20 text-white",
    trend: "text-red-100",
  },
}

export function StatCard({ label, value, icon: Icon, trend, className, gradient, delay = 0 }: StatCardProps) {
  const isGradient = gradient && gradients[gradient]
  const style = isGradient ? gradients[gradient!] : null

  const numericValue = typeof value === "string"
    ? Number(value.replace(/[^0-9.-]/g, ""))
    : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className={cn("overflow-hidden", isGradient ? "border-0 shadow-lg" : "", className)}>
        <CardContent className={cn("p-6", isGradient ? style?.card : "")}>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <p className={cn("text-sm font-medium", isGradient ? "text-white/80" : "text-muted-foreground")}>
                {label}
              </p>
              <p className={cn("text-2xl font-bold tracking-tight", isGradient ? "text-white" : "text-foreground")}>
                {typeof value === "string" ? value : (
                  <CountUp end={numericValue} suffix={value.toString().includes("FCFA") ? " FCFA" : ""} />
                )}
              </p>
              {trend && (
                <p className={cn(
                  "text-xs flex items-center gap-1",
                  isGradient ? style?.trend : trend.positive ? "text-green-600" : "text-red-600"
                )}>
                  <span>{trend.positive ? "↑" : "↓"}</span>
                  {trend.positive ? "+" : ""}{trend.value}% vs mois dernier
                </p>
              )}
            </div>
            <motion.div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                isGradient ? style?.icon : "bg-primary-light"
              )}
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", damping: 10 }}
            >
              <Icon className={cn("h-6 w-6", isGradient ? "" : "text-primary")} />
            </motion.div>
          </div>
          {isGradient && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,transparent_30%,rgba(255,255,255,0.1)_100%)] pointer-events-none" />
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

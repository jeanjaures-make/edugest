"use client"

import { motion } from "framer-motion"
import { staggerContainer } from "@/lib/animations"

interface StaggerChildrenProps {
  children: React.ReactNode
  className?: string
}

export function StaggerChildren({ children, className }: StaggerChildrenProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

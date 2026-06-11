"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navLinks } from "./nav-links"
import type { UserRole } from "@/types"
import { GraduationCap, ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { useState, useEffect, useEffectEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MobileDrawer } from "@/components/ui/mobile-drawer"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  role: UserRole
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const filteredLinks = navLinks.filter((l) => l.roles.includes(role))

  const onPathnameChange = useEffectEvent(() => { setMobileOpen(false) })
  useEffect(() => { onPathnameChange() }, [pathname])

  const linkElements = filteredLinks.map((link) => {
    const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
    const Icon = link.icon
    return (
      <Link key={link.href} href={link.href} title={collapsed ? link.label : undefined}>
        <motion.div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
            isActive ? "text-primary" : "text-gray-500 hover:text-foreground hover:bg-muted"
          )}
          whileHover={{ x: collapsed ? 0 : 4 }}
          whileTap={{ scale: 0.98 }}
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-lg bg-primary-light"
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            />
          )}
          <div className="relative z-10 flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {link.label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </Link>
    )
  })

  const sidebarContent = (
    <>
      <div className="flex h-14 md:h-16 items-center justify-between gap-2 border-b px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm">
            <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-base md:text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              >
                EduGest CI
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5">{linkElements}</nav>
      <div className="border-t p-2 shrink-0 hidden md:block">
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:text-foreground hover:bg-muted transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Réduire</span>
            </>
          )}
        </motion.button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header bar with hamburger */}
      <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-2 border-b bg-white/80 backdrop-blur-sm px-3 md:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            EduGest CI
          </span>
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        {sidebarContent}
      </MobileDrawer>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
        className="hidden md:flex flex-col border-r bg-white overflow-hidden shrink-0"
      >
        {sidebarContent}
      </motion.aside>
    </>
  )
}

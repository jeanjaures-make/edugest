"use client"

import Link from "next/link"
import { Bell, LogOut, ChevronDown, Search, Settings } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getInitials } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface HeaderProps {
  nom: string
  prenom: string
  role: string
  nomEcole: string
  onSignOut: () => void
}

export function Header({ nom, prenom, role, nomEcole, onSignOut }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const roleLabels: Record<string, string> = {
    directeur: "Directeur",
    comptable: "Comptable",
    enseignant: "Enseignant",
    parent: "Parent",
    eleve: "Élève",
  }

  return (
    <header className="hidden md:flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-sm px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Rechercher..." variant="filled" className="pl-9 h-9 text-sm" />
        </div>
        <p className="text-sm font-medium text-foreground hidden lg:block">{nomEcole}</p>
      </div>

      <div className="flex items-center gap-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-500" />
            <motion.span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
            >
              3
            </motion.span>
          </Button>
        </motion.div>

        <div className="relative" ref={menuRef}>
          <motion.button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-muted transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-white">
                {getInitials(nom, prenom)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-tight">{prenom} {nom}</p>
              <p className="text-xs text-muted-foreground capitalize">{roleLabels[role] || role}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white shadow-lg z-50 overflow-hidden"
              >
                <div className="p-3 border-b">
                  <p className="text-sm font-medium">{prenom} {nom}</p>
                  <p className="text-xs text-muted-foreground">{nomEcole}</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/parametres"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </Link>
                  <button
                    onClick={() => { setShowUserMenu(false); onSignOut() }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

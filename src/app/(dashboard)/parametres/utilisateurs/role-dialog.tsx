"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Shield } from "lucide-react"
import { roleLabels } from "@/lib/roles"
import type { UserRole } from "@/types"

interface Utilisateur {
  id: string
  nom: string
  prenom: string
  telephone: string | null
  role: UserRole
  user_id: string
}

interface RoleDialogProps {
  user: Utilisateur
  onRoleChange: (id: string, role: UserRole) => void
}

export function RoleDialog({ user, onRoleChange }: RoleDialogProps) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(user.role)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (role === user.role) { setOpen(false); return }
    setSaving(true)
    await onRoleChange(user.id, role as UserRole)
    setSaving(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <Shield className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le rôle</DialogTitle>
          <DialogDescription>
            Changer les permissions de {user.prenom} {user.nom}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} className="w-full" disabled={saving} loading={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

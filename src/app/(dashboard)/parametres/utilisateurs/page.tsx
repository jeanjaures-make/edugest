"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/ui/data-table"
import { PageTransition } from "@/components/animations/page-transition"
import { FadeInView } from "@/components/animations/fade-in-view"
import { Trash2, Users } from "lucide-react"
import Link from "next/link"
import { roleColors, roleLabels } from "@/lib/roles"
import type { UserRole } from "@/types"
import { RoleDialog } from "./role-dialog"

interface Utilisateur {
  id: string
  nom: string
  prenom: string
  telephone: string | null
  role: UserRole
  user_id: string
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<Utilisateur[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/profils/utilisateurs")
        const data = await res.json()
        if (Array.isArray(data)) setUsers(data)
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  async function handleRoleChange(userId: string, newRole: UserRole) {
    const res = await fetch(`/api/profils/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    if (!res.ok) return
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
  }

  async function handleDelete(userId: string) {
    if (!confirm("Supprimer cet utilisateur ?")) return
    const res = await fetch(`/api/profils/${userId}`, { method: "DELETE" })
    if (!res.ok) return
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const columns: Column<Utilisateur>[] = [
    {
      key: "nom",
      label: "Nom",
      sortable: true,
      cell: (u) => <span className="font-medium">{u.nom}</span>,
    },
    {
      key: "prenom",
      label: "Prénom",
      sortable: true,
      cell: (u) => u.prenom,
    },
    {
      key: "telephone",
      label: "Téléphone",
      sortable: true,
      hideOnMobile: true,
      cell: (u) => u.telephone || <span className="text-muted-foreground">—</span>,
    },
    {
      key: "role",
      label: "Rôle",
      sortable: true,
      cell: (u) => (
        <Badge className={roleColors[u.role]} size="sm">
          {roleLabels[u.role]}
        </Badge>
      ),
    },
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeInView>
          <div>
            <Link href="/parametres" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Retour aux paramètres
            </Link>
            <h1 className="text-2xl font-bold text-foreground mt-1">Utilisateurs</h1>
            <p className="text-sm text-muted-foreground">Gestion des comptes et permissions</p>
          </div>
        </FadeInView>

        <Card>
          <CardContent className="p-4 md:p-6">
            <DataTable
              columns={columns}
              data={users}
              loading={loading}
              searchPlaceholder="Rechercher un utilisateur..."
              emptyMessage="Aucun utilisateur trouvé"
              emptyIcon={Users}
              getRowKey={(u) => u.id}
              pageSize={10}
              mobileCard={(u) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{u.nom} {u.prenom}</p>
                    <p className="text-xs text-muted-foreground">{u.telephone || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={roleColors[u.role]} size="sm">{roleLabels[u.role]}</Badge>
                    <RoleDialog user={u} onRoleChange={handleRoleChange} />
                    <Button variant="ghost" size="icon-sm" className="text-danger" onClick={() => handleDelete(u.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Building, Users, Bell, Shield, Palette, BookOpen, Calendar } from "lucide-react"
import Link from "next/link"

export default function ParametresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-sm text-gray-500">Configuration de votre établissement</p>
      </div>

      <Link href="/parametres/ecole">
        <Card className="cursor-pointer hover:shadow-md transition-shadow mb-6">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Building className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Mon école</h3>
              <p className="text-sm text-gray-500">Modifier les informations de l'établissement</p>
            </div>
            <div className="text-gray-400">→</div>
          </CardContent>
        </Card>
      </Link>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/parametres/classes">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="font-medium">Classes & Matieres</p>
                <p className="text-xs text-gray-500">Niveaux, classes, coefficients</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/parametres/annee-scolaire">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <Calendar className="h-8 w-8 text-cyan-600" />
              <div>
                <p className="font-medium">Annee scolaire</p>
                <p className="text-xs text-gray-500">Gerer les annees scolaires</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/parametres/utilisateurs">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium">Utilisateurs</p>
                <p className="text-xs text-gray-500">Gérer les comptes et rôles</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <Palette className="h-8 w-8 text-purple-600" />
            <div>
              <p className="font-medium">Personnalisation</p>
              <p className="text-xs text-gray-500">Thème, couleurs, branding</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <Bell className="h-8 w-8 text-orange-600" />
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-xs text-gray-500">SMS, email, WhatsApp</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <Shield className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium">Sécurité</p>
              <p className="text-xs text-gray-500">Permissions, logs, 2FA</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

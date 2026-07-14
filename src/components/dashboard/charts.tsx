"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend,
} from "recharts"

interface ChartsData {
  paiementsParMois: { mois: string; montant: number }[]
  presencesBreakdown: { name: string; value: number; color: string }[]
  paiementsStatut: { name: string; value: number; color: string }[]
  topClasses: { classe: string; moyenne: number }[]
}

interface DashboardChartsProps {
  data: ChartsData | null
  loading: boolean
}

const COLORS = {
  primary: "#4F8EF7",
  green: "#22c55e",
  red: "#ef4444",
  orange: "#f97316",
  purple: "#a855f7",
  blue: "#3b82f6",
}

export function DashboardCharts({ data, loading }: DashboardChartsProps) {
  if (loading || !data) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Évolution des paiements</CardTitle></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Statut des présences</CardTitle></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    )
  }

  const hasPaiements = data.paiementsParMois.some((d) => d.montant > 0)
  const hasPresences = data.presencesBreakdown.some((d) => d.value > 0)
  const hasStatutPaiements = data.paiementsStatut.some((d) => d.value > 0)
  const hasTopClasses = data.topClasses.length > 0

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Évolution des paiements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Évolution des paiements</CardTitle>
            <p className="text-sm text-muted-foreground">Montants encaissés par mois (FCFA)</p>
          </CardHeader>
          <CardContent>
            {hasPaiements ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.paiementsParMois}>
                  <defs>
                    <linearGradient id="colorPaiement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} className="text-gray-500" />
                  <YAxis tick={{ fontSize: 12 }} className="text-gray-500" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} FCFA`, "Paiements"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="montant"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    fill="url(#colorPaiement)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Aucun paiement enregistré
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statut des présences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statut des présences</CardTitle>
            <p className="text-sm text-muted-foreground">Répartition global</p>
          </CardHeader>
          <CardContent>
            {hasPresences ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.presencesBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ fontSize: "11px" }}
                  >
                    {data.presencesBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Aucune donnée de présence
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Statut des paiements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statut des paiements</CardTitle>
            <p className="text-sm text-muted-foreground">Payés vs en attente</p>
          </CardHeader>
          <CardContent>
            {hasStatutPaiements ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.paiementsStatut}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ fontSize: "11px" }}
                  >
                    {data.paiementsStatut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Aucun paiement
              </div>
            )}
          </CardContent>
        </Card>

        {/* Moyennes par classe */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Moyennes par classe</CardTitle>
            <p className="text-sm text-muted-foreground">Top 5 des meilleures classes</p>
          </CardHeader>
          <CardContent>
            {hasTopClasses ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.topClasses} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 12 }} className="text-gray-500" />
                  <YAxis type="category" dataKey="classe" tick={{ fontSize: 12 }} className="text-gray-500" width={80} />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(2)}/20`, "Moyenne"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  />
                  <Bar dataKey="moyenne" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Aucune donnée de bulletin
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

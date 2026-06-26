"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatMontant } from "@/lib/utils"
import Image from "next/image"

interface RecuData {
  inscription: {
    id: string
    date_inscription: string
    frais_inscription: number
    statut: string
  }
  eleve: {
    nom: string
    prenom: string
    matricule: string
    date_naissance: string | null
    lieu_naissance: string | null
    sexe: string | null
  }
  classe: { libelle: string } | null
  ecole: {
    nom: string
    adresse: string | null
    telephone: string | null
    email: string | null
    logo_url: string | null
    code_etablissement: string | null
  }
}

export default function RecuPage() {
  const params = useParams()
  const [data, setData] = useState<RecuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      const { data: inscription, error } = await supabase
        .from("inscriptions")
        .select(`
          id, date_inscription, frais_inscription, statut,
          eleve:eleves!inner(nom, prenom, matricule, date_naissance, lieu_naissance, sexe, ecole_id),
          classe:classes(libelle)
        `)
        .eq("id", params.id)
        .single()

      if (error || !inscription) {
        setError("Reçu introuvable")
        setLoading(false)
        return
      }

      const eleveData = inscription.eleve as unknown as { nom: string; prenom: string; matricule: string; date_naissance: string | null; lieu_naissance: string | null; sexe: string | null; ecole_id: string }

      const { data: ecole } = await supabase
        .from("ecoles")
        .select("nom, adresse, telephone, email, logo_url, code_etablissement")
        .eq("id", eleveData.ecole_id)
        .single()

      setData({
        inscription: {
          id: inscription.id,
          date_inscription: inscription.date_inscription,
          frais_inscription: inscription.frais_inscription,
          statut: inscription.statut,
        },
        eleve: {
          nom: eleveData.nom,
          prenom: eleveData.prenom,
          matricule: eleveData.matricule,
          date_naissance: eleveData.date_naissance,
          lieu_naissance: eleveData.lieu_naissance,
          sexe: eleveData.sexe,
        },
        classe: inscription.classe as unknown as { libelle: string } | null,
        ecole: ecole ?? { nom: "", adresse: null, telephone: null, email: null, logo_url: null, code_etablissement: null },
      })
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || "Erreur"}</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/inscriptions">Retour aux inscriptions</Link>
        </Button>
      </div>
    )
  }

  const { ecole, eleve, classe, inscription } = data
  const numRecu = `REC-${inscription.id.slice(0, 8).toUpperCase()}`
  const dateRecu = format(new Date(inscription.date_inscription), "dd MMMM yyyy", { locale: fr })
  const statutLabel = inscription.statut === "confirmee" ? "Confirmé" : inscription.statut === "annulee" ? "Annulé" : "En attente"

  function handlePrint() {
    window.print()
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between no-print">
        <Link href="/inscriptions" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Retour aux inscriptions
        </Link>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" /> Imprimer le reçu
        </Button>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-8 md:p-12">
          <div id="recu-content" className="space-y-8">
            {/* En-tête */}
            <div className="flex items-start justify-between border-b pb-6">
              <div className="flex items-center gap-4">
                {ecole.logo_url ? (
                  <Image src={ecole.logo_url} alt="Logo" width={64} height={64} className="rounded-lg object-cover" />
                ) : (
                  <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {ecole.nom.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{ecole.nom || "Établissement scolaire"}</h1>
                  {ecole.code_etablissement && (
                    <p className="text-sm text-gray-500">Code : {ecole.code_etablissement}</p>
                  )}
                  <p className="text-sm text-gray-500">{ecole.adresse}</p>
                  <p className="text-sm text-gray-500">{ecole.telephone} {ecole.email ? `| ${ecole.email}` : ""}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-primary">REÇU D&apos;INSCRIPTION</h2>
                <p className="text-sm text-gray-500 mt-1">N° {numRecu}</p>
                <p className="text-sm text-gray-500">Date : {dateRecu}</p>
              </div>
            </div>

            {/* Élève */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Élève</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Nom</span><span className="font-medium">{eleve.nom}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Prénom</span><span className="font-medium">{eleve.prenom}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Matricule</span><span className="font-medium">{eleve.matricule}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Classe</span><span className="font-medium">{classe?.libelle || "Non affecté"}</span></div>
                {eleve.date_naissance && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date naissance</span>
                    <span className="font-medium">{format(new Date(eleve.date_naissance), "dd/MM/yyyy", { locale: fr })}</span>
                  </div>
                )}
                {eleve.lieu_naissance && (
                  <div className="flex justify-between"><span className="text-gray-500">Lieu naissance</span><span className="font-medium">{eleve.lieu_naissance}</span></div>
                )}
                {eleve.sexe && (
                  <div className="flex justify-between"><span className="text-gray-500">Sexe</span><span className="font-medium">{eleve.sexe === "M" ? "Masculin" : "Féminin"}</span></div>
                )}
              </div>
            </div>

            {/* Frais */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Frais d&apos;inscription</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-200">
                    <th className="py-2 text-left font-medium text-gray-500">Libellé</th>
                    <th className="py-2 text-right font-medium text-gray-500">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2">Frais d&apos;inscription {eleve.prenom} {eleve.nom}</td>
                    <td className="py-2 text-right font-medium">{formatMontant(inscription.frais_inscription)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-900">
                    <td className="py-2 font-bold text-gray-900">Total</td>
                    <td className="py-2 text-right font-bold text-gray-900">{formatMontant(inscription.frais_inscription)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Statut */}
            <div className="flex items-center justify-between border-t pt-4 text-sm">
              <span className="text-gray-500">Statut du paiement</span>
              <span className={`font-semibold px-3 py-1 rounded-full text-xs ${
                inscription.statut === "confirmee" ? "bg-green-100 text-green-700" :
                inscription.statut === "annulee" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {statutLabel}
              </span>
            </div>

            {/* Signature */}
            <div className="grid grid-cols-2 gap-8 pt-6 text-sm">
              <div>
                <p className="text-gray-500 mb-8">Cachet de l&apos;établissement</p>
                <div className="border-t border-gray-300 pt-1">
                  <p className="font-medium text-gray-900">Le Directeur</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-8">Signature du parent</p>
                <div className="border-t border-gray-300 pt-1">
                  <p className="font-medium text-gray-900">Le Parent</p>
                </div>
              </div>
            </div>

            {/* Mention */}
            <div className="text-center text-xs text-gray-400 pt-4 border-t">
              <p>EduGest CI — Document généré le {format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
              <p>Ce reçu fait office de justificatif d&apos;inscription</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .no-print { display: none !important; }
          @page { margin: 15mm; }
        }
      `}</style>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatMontant } from "@/lib/utils"
import Image from "next/image"

interface RecuPaiement {
  paiement: {
    id: string
    reference: string
    montant: number
    methode: string
    statut: string
    telephone: string | null
    date_paiement: string
  }
  echeancier: {
    montant_total: number
    montant_restant: number
    statut: string
  } | null
  eleve: { nom: string; prenom: string; matricule: string }
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

const METHODE_LABELS: Record<string, string> = {
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  especes: "Espèces",
  cheque: "Chèque",
  virement: "Virement bancaire",
}

export default function RecuPaiementPage() {
  const params = useParams()
  const [data, setData] = useState<RecuPaiement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      const { data: paiement, error: err } = await supabase
        .from("paiements")
        .select(`
          id, reference, montant, methode, statut, telephone, date_paiement, echeancier_id, eleve_id,
          eleve:eleves!inner(nom, prenom, matricule, ecole_id),
          echeancier:echeanciers(montant_total, montant_restant, statut)
        `)
        .eq("id", params.id)
        .single()

      if (err || !paiement) {
        setError("Reçu introuvable")
        setLoading(false)
        return
      }

      const p = paiement as unknown as {
        id: string; reference: string; montant: number; methode: string; statut: string
        telephone: string | null; date_paiement: string; eleve_id: string
        eleve: { nom: string; prenom: string; matricule: string; ecole_id: string }
        echeancier: { montant_total: number; montant_restant: number; statut: string } | null
      }

      const { data: ecole } = await supabase
        .from("ecoles")
        .select("nom, adresse, telephone, email, logo_url, code_etablissement")
        .eq("id", p.eleve.ecole_id)
        .single()

      const { data: eleveClasse } = await supabase
        .from("eleves")
        .select("classe:classes(libelle)")
        .eq("id", p.eleve_id)
        .single()

      const classeArr = (eleveClasse?.classe as { libelle: string }[] | undefined) || []
      const classe = classeArr.length > 0 ? classeArr[0] : null

      setData({
        paiement: {
          id: p.id, reference: p.reference, montant: p.montant,
          methode: p.methode, statut: p.statut, telephone: p.telephone,
          date_paiement: p.date_paiement,
        },
        echeancier: p.echeancier || null,
        eleve: { nom: p.eleve.nom, prenom: p.eleve.prenom, matricule: p.eleve.matricule },
        classe,
        ecole: ecole ?? { nom: "", adresse: null, telephone: null, email: null, logo_url: null, code_etablissement: null },
      })
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || "Erreur"}</p>
        <Button asChild variant="link" className="mt-2"><Link href="/paiements">Retour aux paiements</Link></Button>
      </div>
    )
  }

  const { ecole, eleve, classe, paiement, echeancier } = data
  const methodeLabel = METHODE_LABELS[paiement.methode] || paiement.methode
  const datePaiement = format(new Date(paiement.date_paiement), "dd/MM/yyyy HH:mm")

  function handlePrint() { window.print() }

  const totalPaye = echeancier ? echeancier.montant_total - echeancier.montant_restant : 0

  return (
    <>
      <div className="max-w-[148mm] mx-auto py-4 px-2">
        <div className="flex items-center justify-between no-print mb-3">
          <Link href="/paiements" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
          <Button onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" /> Imprimer
          </Button>
        </div>

        <div id="recu-paiement" className="a6-recu">
          {/* Haut — Logo + École + Titre */}
          <div className="a6-header">
            <div className="a6-logo">
              {ecole.logo_url ? (
                <Image src={ecole.logo_url} alt="" width={48} height={48} className="a6-logo-img" />
              ) : (
                <div className="a6-logo-placeholder">{ecole.nom.charAt(0)}</div>
              )}
            </div>
            <div className="a6-ecole-info">
              <div className="a6-ecole-nom">{ecole.nom || "Établissement"}</div>
              {ecole.code_etablissement && <div className="a6-code">Code : {ecole.code_etablissement}</div>}
              <div className="a6-ecoord">{ecole.adresse && <span>{ecole.adresse} </span>}{ecole.telephone && <span>Tel : {ecole.telephone}</span>}</div>
              {ecole.email && <div className="a6-ecoord">{ecole.email}</div>}
            </div>
            <div className="a6-titre-box">
              <div className="a6-titre">REÇU</div>
              <div className="a6-ref">N° {paiement.reference}</div>
            </div>
          </div>

          {/* Corps — Élève + Paiement */}
          <div className="a6-body">
            <div className="a6-eleve">
              <span className="a6-label">Élève :</span>
              <span className="a6-valeur">{eleve.prenom} {eleve.nom}</span>
            </div>
            <div className="a6-eleve-row">
              <span><span className="a6-label">Matricule :</span> {eleve.matricule}</span>
              <span><span className="a6-label">Classe :</span> {classe?.libelle || "—"}</span>
            </div>
          </div>

          {/* Tableau Montant */}
          <table className="a6-table">
            <thead>
              <tr>
                <th>Libellé</th>
                <th className="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{methodeLabel}{paiement.telephone ? ` (${paiement.telephone})` : ""}</td>
                <td className="text-right font-bold">{formatMontant(paiement.montant)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="font-bold">Total payé</td>
                <td className="text-right font-bold">{formatMontant(paiement.montant)}</td>
              </tr>
              {echeancier && (
                <>
                  <tr>
                    <td className="a6-solde-label">Reste à payer</td>
                    <td className={`text-right font-bold ${echeancier.montant_restant <= 0 ? "a6-solde" : "a6-restant"}`}>
                      {echeancier.montant_restant <= 0 ? "SOLDE" : formatMontant(echeancier.montant_restant)}
                    </td>
                  </tr>
                </>
              )}
            </tfoot>
          </table>

          {/* Bas — Date + Signatures */}
          <div className="a6-footer">
            <div className="a6-date">Date : {datePaiement}</div>
            <div className="a6-signatures">
              <div className="a6-sig">
                <span>Cachet &amp; Comptable</span>
                <div className="a6-sig-line"></div>
              </div>
              <div className="a6-sig">
                <span>Parent</span>
                <div className="a6-sig-line"></div>
              </div>
            </div>
          </div>

          {/* Mention légale */}
          <div className="a6-mention">EduGest CI — Reçu de paiement</div>
        </div>
      </div>

      <style>{`
        .a6-recu {
          width: 148mm;
          min-height: 103mm;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 5mm 6mm;
          display: flex;
          flex-direction: column;
          gap: 2.5mm;
          font-family: system-ui, sans-serif;
        }

        .a6-header {
          display: flex;
          align-items: center;
          gap: 3mm;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 2.5mm;
        }

        .a6-logo-img {
          border-radius: 4px;
          object-fit: cover;
          width: 48px;
          height: 48px;
        }

        .a6-logo-placeholder {
          width: 48px; height: 48px;
          border-radius: 4px;
          background: #1e40af;
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 20px;
        }

        .a6-ecole-info {
          flex: 1;
          min-width: 0;
        }

        .a6-ecole-nom {
          font-size: 11px;
          font-weight: 700;
          color: #1e40af;
          text-transform: uppercase;
          line-height: 1.2;
        }

        .a6-code {
          font-size: 8px;
          color: #6b7280;
        }

        .a6-ecoord {
          font-size: 7.5px;
          color: #4b5563;
          line-height: 1.3;
        }

        .a6-titre-box {
          text-align: right;
          flex-shrink: 0;
        }

        .a6-titre {
          font-size: 16px;
          font-weight: 800;
          color: #1e40af;
          letter-spacing: 2px;
        }

        .a6-ref {
          font-size: 7px;
          font-family: monospace;
          color: #6b7280;
        }

        .a6-body {
          display: flex;
          flex-direction: column;
          gap: 1mm;
          padding: 1.5mm 0;
        }

        .a6-eleve {
          display: flex;
          gap: 3mm;
          font-size: 9.5px;
        }

        .a6-eleve-row {
          display: flex;
          gap: 6mm;
          font-size: 8.5px;
          color: #4b5563;
        }

        .a6-label {
          font-weight: 600;
          color: #374151;
        }

        .a6-valeur {
          font-weight: 700;
          color: #111827;
          text-transform: uppercase;
        }

        .a6-table {
          width: 100%;
          font-size: 8px;
          border-collapse: collapse;
        }

        .a6-table th {
          background: #1e40af;
          color: white;
          padding: 1.5mm 2mm;
          text-align: left;
          font-weight: 600;
        }

        .a6-table td {
          padding: 1mm 2mm;
          border-bottom: 1px solid #e5e7eb;
        }

        .a6-table tfoot td {
          border-bottom: none;
          padding-top: 1.5mm;
        }

        .a6-solde {
          color: #16a34a;
        }

        .a6-restant {
          color: #dc2626;
        }

        .a6-solde-label {
          color: #374151;
          font-weight: 600;
        }

        .a6-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 1.5mm;
          border-top: 1px solid #d1d5db;
          margin-top: auto;
        }

        .a6-date {
          font-size: 7.5px;
          color: #6b7280;
        }

        .a6-signatures {
          display: flex;
          gap: 8mm;
        }

        .a6-sig {
          text-align: center;
          font-size: 7px;
          color: #6b7280;
        }

        .a6-sig-line {
          width: 30mm;
          border-top: 1px solid #9ca3af;
          margin-top: 2px;
        }

        .a6-mention {
          text-align: center;
          font-size: 6.5px;
          color: #9ca3af;
          padding-top: 1mm;
        }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; padding: 0; }
          .no-print { display: none !important; }

          @page {
            size: 148mm 105mm landscape;
            margin: 2mm;
          }

          .a6-recu {
            border: none;
            border-radius: 0;
            width: 100%;
            min-height: 100%;
            padding: 4mm 5mm;
          }
        }
      `}</style>
    </>
  )
}

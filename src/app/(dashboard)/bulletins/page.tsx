"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Download, FileText, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { PageTransition } from "@/components/animations/page-transition"
import { FadeInView } from "@/components/animations/fade-in-view"
import { motion } from "framer-motion"
import { staggerContainer, statCardItem } from "@/lib/animations"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface ClasseItem { id: string; libelle: string }
interface BulletinRow {
  id: string
  eleve_id: string
  eleve_nom: string
  eleve_prenom: string
  classe_libelle: string | null
  trimestre: number
  moyenne_generale: number | null
  rang: number | null
  appreciation: string | null
  created_at: string
}

export default function BulletinsPage() {
  const { profile } = useUser()
  const [classes, setClasses] = useState<ClasseItem[]>([])
  const [enfants, setEnfants] = useState<{ id: string; nom: string; prenom: string }[]>([])
  const [bulletins, setBulletins] = useState<BulletinRow[]>([])
  const [loading, setLoading] = useState(true)
  const [bulletinLoading, setBulletinLoading] = useState(false)
  const [classeId, setClasseId] = useState("")
  const [eleveId, setEleveId] = useState("")
  const [trimestre, setTrimestre] = useState("2")
  const [generating, setGenerating] = useState(false)
  const [ecole, setEcole] = useState<{ nom: string; adresse: string | null; telephone: string | null; email: string | null; logo_url: string | null; code_etablissement: string | null } | null>(null)
  const isParent = profile?.role === "parent"

  const loadClasses = useCallback(async () => {
    if (!profile?.ecole_id) { setLoading(false); return }
    let query = supabase.from("classes").select("id, libelle").eq("ecole_id", profile.ecole_id)
    if (profile.role === "enseignant") {
      query = query.eq("professeur_principal_id", profile.id)
    }
    const { data } = await query.order("libelle")
    if (data) setClasses(data)
    setLoading(false)
  }, [profile])

  useEffect(() => { loadClasses() }, [loadClasses])

  useEffect(() => {
    const p = profile
    if (!p?.ecole_id) return
    async function init() {
      if (isParent && p?.id) {
        const { data } = await supabase
          .from("eleves")
          .select("id, nom, prenom")
          .eq("parent_id", p.id)
          .eq("statut", "actif")
        if (data) {
          setEnfants(data as { id: string; nom: string; prenom: string }[])
        }
      }
      const { data: ecoleData } = await supabase
        .from("ecoles")
        .select("nom, adresse, telephone, email, logo_url, code_etablissement")
        .eq("id", p!.ecole_id)
        .single()
      if (ecoleData) setEcole(ecoleData)
    }
    init()
  }, [profile, isParent])

  const loadBulletins = useCallback(async () => {
    if (!profile?.ecole_id) return
    setBulletinLoading(true)
    let query = supabase
      .from("bulletins")
      .select("id, eleve_id, trimestre, moyenne_generale, rang, appreciation, created_at, eleve:eleves!inner(nom, prenom), classe:classes!inner(libelle)")
      .eq("eleve.ecole_id", profile.ecole_id)

    if (classeId) query = query.eq("classe_id", classeId)
    if (eleveId) query = query.eq("eleve_id", eleveId)
    if (trimestre) query = query.eq("trimestre", parseInt(trimestre))

    const { data } = await query.order("rang", { ascending: true })

    if (data) {
      setBulletins((data as unknown as { id: string; eleve_id: string; trimestre: number; moyenne_generale: number | null; rang: number | null; appreciation: string | null; created_at: string; eleve: { nom: string; prenom: string } | null; classe: { libelle: string } | null }[]).map((b) => ({
        id: b.id,
        eleve_id: b.eleve_id,
        eleve_nom: b.eleve?.nom ?? "",
        eleve_prenom: b.eleve?.prenom ?? "",
        classe_libelle: b.classe?.libelle ?? null,
        trimestre: b.trimestre,
        moyenne_generale: b.moyenne_generale,
        rang: b.rang,
        appreciation: b.appreciation,
        created_at: b.created_at,
      })))
    }
    setBulletinLoading(false)
  }, [profile, classeId, eleveId, trimestre])

  useEffect(() => { loadBulletins() }, [loadBulletins])

  async function generateBulletins() {
    if (!profile?.ecole_id || !classeId) return
    setGenerating(true)
    try {
      const res = await fetch("/api/bulletins/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classe_id: classeId, trimestre: parseInt(trimestre) }),
      })
      if (res.ok) loadBulletins()
    } finally {
      setGenerating(false)
    }
  }

  async function downloadPdf(bulletin: BulletinRow) {
    const { data: eleve } = await supabase
      .from("eleves")
      .select("nom, prenom, matricule, date_naissance, lieu_naissance, sexe, nationalite")
      .eq("id", bulletin.eleve_id)
      .maybeSingle()

    const { data: notesData } = await supabase
      .from("notes")
      .select("valeur, appreciation, evaluation:evaluations!inner(libelle, coefficient, enseignant:personnel(nom, prenom), matiere:matieres(libelle, coefficient))")
      .eq("eleve_id", bulletin.eleve_id)
      .eq("evaluation.trimestre", bulletin.trimestre)
      .eq("evaluation.classe_id", classeId)

    const { count: effectif } = await supabase
      .from("eleves")
      .select("id", { count: "exact", head: true })
      .eq("classe_id", classeId)
      .eq("statut", "actif")

    const nom = `${bulletin.eleve_prenom} ${bulletin.eleve_nom}`.toUpperCase()
    const classe = bulletin.classe_libelle || ""
    const trim = bulletin.trimestre
    const moyenne = (bulletin.moyenne_generale ?? 0).toFixed(2)
    const rang = bulletin.rang || "-"
    const matricule = eleve?.matricule ?? ""
    const dateNaiss = eleve?.date_naissance ? format(new Date(eleve.date_naissance), "dd/MM/yyyy") : ""
    const sexe = eleve?.sexe ?? ""
    const nationalite = eleve?.nationalite ?? "Ivoirienne"
    const ecoleNom = ecole?.nom || "Établissement scolaire"
    const ecoleLogo = ecole?.logo_url || ""
    const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
    const mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
    const d = new Date()
    const dateStr = `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`

    function escapeHtml(s: string) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
    }

    type NoteRow = { valeur: number | null; appreciation: string | null; evaluation: { libelle: string; coefficient: number; enseignant: { nom: string; prenom: string } | null; matiere: { libelle: string; coefficient: number } | null } | null }
    type SubjectRow = { matiere: string; moy: string; coeff: number; mCoef: string; prof: string; appr: string }

    const subjectMap = new Map<string, { total: number; coeffSum: number; matCoeff: number; enseignant: string; appreciations: string[] }>()
    for (const n of (notesData || []) as unknown as NoteRow[]) {
      const matiere = n.evaluation?.matiere?.libelle || "Inconnue"
      if (!subjectMap.has(matiere)) {
        subjectMap.set(matiere, {
          total: 0,
          coeffSum: 0,
          matCoeff: n.evaluation?.matiere?.coefficient || 1,
          enseignant: n.evaluation?.enseignant
            ? `${n.evaluation.enseignant.prenom} ${n.evaluation.enseignant.nom}`
            : "",
          appreciations: [],
        })
      }
      const entry = subjectMap.get(matiere)!
      const val = n.valeur ?? 0
      const evalCoeff = n.evaluation?.coefficient || 1
      entry.total += val * evalCoeff
      entry.coeffSum += evalCoeff
      if (n.appreciation) entry.appreciations.push(n.appreciation)
    }

    const lignesNotes: SubjectRow[] = []
    for (const [matiere, s] of subjectMap) {
      const moy = s.coeffSum > 0 ? (s.total / s.coeffSum) : 0
      lignesNotes.push({
        matiere: escapeHtml(matiere),
        moy: moy.toFixed(2).replace(".", ","),
        coeff: s.matCoeff,
        mCoef: (moy * s.matCoeff).toFixed(2).replace(".", ","),
        prof: escapeHtml(s.enseignant),
        appr: escapeHtml(s.appreciations.filter(Boolean).join("; ")),
      })
    }

    const nomEscaped = escapeHtml(nom)
    const classeEscaped = escapeHtml(classe)
    const matriculeEscaped = escapeHtml(matricule)
    const nationaliteEscaped = escapeHtml(nationalite)
    const ecoleNomEscaped = escapeHtml(ecoleNom)
    const logoImg = ecoleLogo
      ? `<img src="${ecoleLogo}" alt="Logo" style="width:65px; height:65px; object-fit:contain;" />`
      : `<div style="width:65px; height:65px; border:1px solid #000; margin:auto; display:flex; align-items:center; justify-content:center; font-size:8px; color:#666;">LOGO</div>`

    const totalCoeff = lignesNotes.reduce((s, l) => s + l.coeff, 0)
    const totalPoints = lignesNotes.reduce((s, l) => s + parseFloat(l.mCoef.replace(",", ".")), 0)
    const anneeScolaire = `${new Date().getFullYear()-1} - ${new Date().getFullYear()}`
    const trimLabel = trim === 1 ? "1er" : trim === 2 ? "2ème" : "3ème"

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 12mm 12mm 10mm 15mm;
    box-sizing: border-box;
    background: white;
    margin: 0 auto;
  }
  @media print {
    body { margin: 0; }
    .page { box-shadow: none; margin: 0; }
  }
  table { width: 100%; border-collapse: collapse; margin-bottom: 3px; }
  td, th { border: 1px solid #000; padding: 5px 4px; font-size: 11px; vertical-align: middle; }
  .c { text-align: center; }
  .r { text-align: right; }
  .l { text-align: left; }
  .b { font-weight: bold; }
  .i { font-style: italic; }
  .u { text-decoration: underline; }
  .bg-gray { background-color: #e8e8e8; }
  .fs-9 { font-size: 9px; }
  .fs-10 { font-size: 10px; }
  .no-border td, .no-border th { border: none; }
  .sign-line { border-top: 1px solid #000; width: 80%; margin: 1px auto 0; padding-top: 1px; }
  .checkbox { display: inline-block; width: 10px; height: 10px; border: 1px solid #000; margin-right: 3px; vertical-align: middle; background: white; }
</style></head><body>
<div class="page">

  <!-- ===== EN-TETE ===== -->
  <table class="no-border" style="margin-bottom:6px;">
    <tr>
      <td style="width:75px; border:none; text-align:center; vertical-align:middle;">
        ${logoImg}
      </td>
      <td style="border:none; text-align:center; vertical-align:middle;">
        <div style="font-size:12px; font-weight:bold;">RÉPUBLIQUE DE CÔTE D'IVOIRE</div>
        <div style="font-size:10px; font-style:italic;">Union - Discipline - Travail</div>
        <div style="font-size:10px;">Ministère de l'Éducation Nationale et de l'Alphabétisation</div>
        <div style="font-size:11px; font-weight:bold; text-decoration:underline; margin-top:1px;">${ecoleNomEscaped}</div>
      </td>
      <td style="width:130px; border:none; text-align:right; vertical-align:top; font-size:10px;">
        <b>Année Scolaire ${anneeScolaire}<br>${trimLabel} TRIMESTRE</b>
      </td>
    </tr>
  </table>

  <!-- ===== IDENTITE ELEVE ===== -->
  <table style="margin-bottom:4px;">
    <tr>
      <td style="width:50%; text-align:left; vertical-align:middle; padding:8px 6px; font-size:12px;" colspan="2"><b>Nom et Prénom :</b> ${nomEscaped}</td>
      <td style="width:25%; text-align:left; vertical-align:middle; padding:8px 6px; font-size:12px;"><b>Matricule :</b> ${matriculeEscaped}</td>
      <td style="width:25%; text-align:left; vertical-align:middle; padding:8px 6px; font-size:12px;"><b>Né(e) le :</b> ${dateNaiss}</td>
    </tr>
    <tr>
      <td style="width:35%; text-align:left; vertical-align:middle; padding:8px 6px; font-size:12px;"><b>Classe :</b> ${classeEscaped}</td>
      <td style="width:15%; text-align:left; vertical-align:middle; padding:8px 6px; font-size:12px;"><b>Effectif :</b> ${effectif ?? 0}</td>
      <td style="width:25%; text-align:left; vertical-align:middle; padding:8px 6px; font-size:12px;"><b>Sexe :</b> ${sexe === "M" ? "Masculin" : sexe === "F" ? "Féminin" : ""}</td>
      <td style="width:25%; text-align:left; vertical-align:middle; padding:8px 6px; font-size:12px;"><b>Nationalité :</b> ${nationaliteEscaped}</td>
    </tr>
  </table>

  <!-- ===== TABLEAU DES NOTES ===== -->
  <table>
    <thead>
      <tr class="bg-gray">
        <th style="width:5%;">N°</th>
        <th style="width:26%;">DISCIPLINES</th>
        <th style="width:7%;">Crédit</th>
        <th style="width:7%;">Coef</th>
        <th style="width:10%;">Note<br>Élève</th>
        <th style="width:10%;">Moy.<br>Classe</th>
        <th style="width:18%;">APPRÉCIATION</th>
        <th style="width:17%;">PROFESSEUR</th>
      </tr>
    </thead>
    <tbody>
      ${lignesNotes.length > 0 ? lignesNotes.map((l, i) => `<tr>
        <td class="c">${i + 1}</td>
        <td>${l.matiere}</td>
        <td class="c">${l.coeff}</td>
        <td class="c">${l.coeff}</td>
        <td class="c b">${l.moy}</td>
        <td class="c">-</td>
        <td class="fs-10">${l.appr}</td>
        <td class="fs-10">${l.prof}</td>
      </tr>`).join("") : `<tr><td colspan="8" class="c" style="padding:12px;">Aucune note saisie pour ce trimestre</td></tr>`}
    </tbody>
    <tfoot>
      <tr class="b">
        <td colspan="3" class="l">Total des coefficients :</td>
        <td class="c">${totalCoeff}</td>
        <td class="c">${totalPoints.toFixed(2).replace(".", ",")}</td>
        <td colspan="3" class="c">-</td>
      </tr>
      <tr class="b">
        <td colspan="3" class="l">Moyenne générale de l'élève :</td>
        <td colspan="2" class="c" style="font-size:13px;">${moyenne.replace(".", ",")} / 20</td>
        <td colspan="3" class="c">-</td>
      </tr>
      <tr class="b">
        <td colspan="3" class="l">Moyenne générale de la classe :</td>
        <td colspan="2" class="c">- / 20</td>
        <td colspan="3"></td>
      </tr>
      <tr class="b">
        <td colspan="3" class="l">Plus haute moyenne de la classe :</td>
        <td colspan="2" class="c">- / 20</td>
        <td colspan="3"></td>
      </tr>
      <tr class="b">
        <td colspan="3" class="l">Plus basse moyenne de la classe :</td>
        <td colspan="2" class="c">- / 20</td>
        <td colspan="3"></td>
      </tr>
      <tr class="b">
        <td colspan="3" class="l">Rang de l'élève :</td>
        <td colspan="2" class="c" style="font-size:13px;">${rang === "-" ? "-" : rang + "e / " + (effectif ?? 0)}</td>
        <td colspan="3"></td>
      </tr>
    </tfoot>
  </table>

  <!-- ===== OBSERVATIONS ===== -->
  <table style="margin-top:2px;">
    <tr>
      <td style="padding:4px 5px; font-size:12px;"><b>Observations du Conseil de Classe :</b></td>
    </tr>
    <tr>
      <td style="padding:4px 5px; height:32px; vertical-align:middle; font-size:12px; font-style:italic;">
        ${escapeHtml(bulletin.appreciation || "")}
      </td>
    </tr>
  </table>

  <!-- ===== DECISION + ABSENCES ===== -->
  <table style="margin-top:2px;">
    <tr>
      <td style="width:55%; padding:6px 5px; font-size:12px; vertical-align:middle;">
        <b>Décision du conseil de classe :</b><br>
        <span class="checkbox"></span> Passage &nbsp;
        <span class="checkbox"></span> Redoublement &nbsp;
        <span class="checkbox"></span> Orientation
      </td>
      <td style="width:45%; padding:6px 5px; font-size:12px; vertical-align:middle;">
        <b>Absences :</b><br>
        Justifiées : <span class="checkbox"></span> 0 &nbsp;&nbsp;
        Non justifiées : <span class="checkbox"></span> 0 &nbsp;&nbsp;
        Retards : <span class="checkbox"></span> 0
      </td>
    </tr>
  </table>

  <!-- ===== SIGNATURES 3 COLONNES ===== -->
  <table style="margin-top:8px;">
    <tr>
      <td style="width:33%; text-align:center; vertical-align:top; border:none;">
        <div><b>Le Professeur Principal</b></div>
        <div style="height:22px;"></div>
        <div class="sign-line"></div>
        <div class="fs-9" style="margin-top:2px;">Date : ....../....../${new Date().getFullYear()}</div>
      </td>
      <td style="width:34%; text-align:center; vertical-align:top; border:none;">
        <div><b>Le Délégué de classe</b></div>
        <div style="height:22px;"></div>
        <div class="sign-line"></div>
      </td>
      <td style="width:33%; text-align:center; vertical-align:top; border:none;">
        <div><b>Le Chef d'Établissement</b></div>
        <div style="height:6px;"></div>
        <div style="width:45px; height:45px; border:2px solid #000; border-radius:50%; margin:2px auto; display:flex; align-items:center; justify-content:center; font-size:6px; color:#666;">CACHET</div>
        <div class="sign-line" style="margin-top:4px;"></div>
      </td>
    </tr>
  </table>

  <!-- ===== PIED DE PAGE ===== -->
  <table class="no-border" style="margin-top:4px;">
    <tr>
      <td style="width:33%; border:none; font-size:9px;">${ecoleNomEscaped}</td>
      <td style="width:34%; border:none; text-align:center; font-size:9px;">EduGest CI</td>
      <td style="width:33%; border:none; text-align:right; font-size:9px;">Imprimé le ${dateStr}</td>
    </tr>
  </table>

</div>
</body></html>`

    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    container.style.top = "0"
    container.style.width = "794px"
    container.style.background = "#fff"
    container.innerHTML = html
    document.body.appendChild(container)

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
      })
      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      const doc = new jsPDF({ format: "a4", orientation: "portrait", unit: "px" })
      const pageW = doc.internal.pageSize.getWidth()
      const imgH = (canvas.height * pageW) / canvas.width
      doc.addImage(imgData, "JPEG", 0, 0, pageW, imgH)
      doc.save(`bulletin-${bulletin.eleve_prenom}-${bulletin.eleve_nom}-T${bulletin.trimestre}.pdf`)
    } finally {
      document.body.removeChild(container)
    }
  }

  const stats = {
    total: bulletins.length,
    moyenne: bulletins.length > 0
      ? (bulletins.reduce((s, b) => s + (b.moyenne_generale ?? 0), 0) / bulletins.length).toFixed(1)
      : "-",
    reussite: bulletins.length > 0
      ? Math.round((bulletins.filter((b) => (b.moyenne_generale ?? 0) >= 10).length / bulletins.length) * 100)
      : 0,
  }

  const columns: Column<BulletinRow>[] = [
    {
      key: "eleve", label: "Élève", sortable: true,
      cell: (b) => <span className="font-medium">{b.eleve_prenom} {b.eleve_nom}</span>,
    },
    {
      key: "classe", label: "Classe", sortable: true,
      cell: (b) => <span>{b.classe_libelle}</span>,
    },
    {
      key: "trimestre", label: "Trim.", sortable: true,
      cell: (b) => <Badge variant="info" size="sm">T{b.trimestre}</Badge>,
    },
    {
      key: "moyenne", label: "Moyenne", sortable: true,
      cell: (b) => <span className="font-bold">{(b.moyenne_generale ?? 0).toFixed(1)}/20</span>,
    },
    {
      key: "rang", label: "Rang", sortable: true,
      cell: (b) => <span>{b.rang ? `${b.rang}e` : "-"}</span>,
    },
    {
      key: "appreciation", label: "Appréciation",
      cell: (b) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{b.appreciation ?? "-"}</span>,
    },
    {
      key: "date", label: "Date", sortable: true,
      cell: (b) => <span className="text-xs text-muted-foreground">{b.created_at ? format(new Date(b.created_at), "dd/MM/yyyy", { locale: fr }) : "-"}</span>,
    },
    {
      key: "actions", label: "",
      cell: (b) => (
        <Button variant="ghost" size="icon" onClick={() => downloadPdf(b)} title="Télécharger PDF">
          <Download className="h-4 w-4 text-blue-600" />
        </Button>
      ),
    },
  ]

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const eId = params.get("eleve_id")
      if (eId) setEleveId(eId)
    }
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeInView>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bulletins</h1>
              <p className="text-sm text-muted-foreground">{isParent ? "Consultez les bulletins de vos enfants" : "Génération et consultation des bulletins de notes"}</p>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Trimestre</Label>
                <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={trimestre} onChange={(e) => setTrimestre(e.target.value)}>
                  <option value="1">Trimestre 1</option>
                  <option value="2">Trimestre 2</option>
                  <option value="3">Trimestre 3</option>
                </select>
              </div>
              {isParent ? (
                <div className="space-y-1">
                  <Label className="text-xs">Enfant</Label>
                  <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={eleveId} onChange={(e) => setEleveId(e.target.value)}>
                    <option value="">Sélectionner un enfant</option>
                    {enfants.map((e) => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                  </select>
                  {enfants.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">Aucun enfant inscrit</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs">Classe</Label>
                  <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={classeId} onChange={(e) => setClasseId(e.target.value)}>
                    <option value="">{profile?.role === "directeur" ? "Toutes les classes" : "Sélectionner une classe"}</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                  </select>
                  {profile?.role === "enseignant" && classes.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">Vous n&apos;êtes professeur principal d&apos;aucune classe</p>
                  )}
                </div>
              )}
              {!isParent && (
                <Button onClick={generateBulletins} disabled={!classeId || generating}>
                  {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  {generating ? "Génération..." : "Générer"}
                </Button>
              )}
            </div>
          </div>
        </FadeInView>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <motion.div variants={statCardItem} custom={0}>
            <Card className="overflow-hidden border-0">
              <CardContent className="p-4 md:p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <p className="text-xs md:text-sm text-blue-100">Bulletins</p>
                <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={statCardItem} custom={1}>
            <Card className="overflow-hidden border-0">
              <CardContent className="p-4 md:p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                <p className="text-xs md:text-sm text-emerald-100">Moyenne générale</p>
                <p className="text-xl md:text-2xl font-bold">{stats.moyenne}/20</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={statCardItem} custom={2}>
            <Card className="overflow-hidden border-0">
              <CardContent className="p-4 md:p-6 bg-gradient-to-br from-violet-600 to-violet-700 text-white">
                <p className="text-xs md:text-sm text-violet-100">Taux de réussite</p>
                <p className="text-xl md:text-2xl font-bold">{stats.reussite}%</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Liste des bulletins</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={bulletins}
              loading={bulletinLoading}
              searchPlaceholder="Rechercher un élève..."
              emptyMessage={isParent ? "Aucun bulletin pour cet enfant" : classeId ? "Aucun bulletin. Sélectionnez une classe et cliquez sur Générer." : "Sélectionnez une classe pour voir les bulletins"}
              getRowKey={(b) => b.id}
              pageSize={10}
              mobileCard={(b) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{b.eleve_prenom} {b.eleve_nom}</p>
                    <p className="text-xs text-muted-foreground">{b.classe_libelle} • T{b.trimestre}</p>
                    <p className="text-xs text-muted-foreground">Moy: {(b.moyenne_generale ?? 0).toFixed(1)}/20 • Rang: {b.rang ? `${b.rang}e` : "-"}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => downloadPdf(b)}>
                    <Download className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}

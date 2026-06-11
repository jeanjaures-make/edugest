"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Download, FileText, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface ClasseItem { id: string; libelle: string }
interface BulletinRow {
  id: string
  eleve: { nom: string; prenom: string } | null
  classe: { libelle: string } | null
  trimestre: number
  moyenne_generale: number | null
  rang: number | null
  appreciation: string | null
  created_at: string
}

export default function BulletinsPage() {
  const { profile } = useUser()
  const [classes, setClasses] = useState<ClasseItem[]>([])
  const [bulletins, setBulletins] = useState<BulletinRow[]>([])
  const [loading, setLoading] = useState(true)
  const [classeId, setClasseId] = useState("")
  const [trimestre, setTrimestre] = useState("2")
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!profile?.ecole_id) { setLoading(false); return }
    supabase.from("classes").select("id, libelle").eq("ecole_id", profile.ecole_id).order("libelle").then(({ data }) => {
      if (data) setClasses(data)
      setLoading(false)
    })
  }, [profile?.ecole_id])

  async function loadBulletins() {
    if (!profile?.ecole_id) return
    const { data } = await supabase
      .from("bulletins")
      .select("id, trimestre, moyenne_generale, rang, appreciation, created_at, eleve:eleves(nom, prenom), classe:classes(libelle)")
      .eq("classe.ecole_id", profile.ecole_id)
      .eq("trimestre", parseInt(trimestre))
      .order("rang", { ascending: true })
    if (data) setBulletins(data as unknown as BulletinRow[])
  }

  useEffect(() => { loadBulletins() }, [profile?.ecole_id, trimestre])

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
      .eq("id", bulletin.eleve?.prenom)
      .maybeSingle()

    const { data: notesData } = await supabase
      .from("notes")
      .select("valeur, appreciation, evaluation:evaluations!inner(libelle, coefficient, matiere:matieres(libelle, coefficient))")
      .eq("evaluation.classe_id", bulletin.eleve?.prenom)
      .eq("evaluation.trimestre", bulletin.trimestre)

    const nom = `${bulletin.eleve?.prenom || ""} ${bulletin.eleve?.nom || ""}`.toUpperCase()
    const classe = bulletin.classe?.libelle || ""
    const trim = bulletin.trimestre
    const moyenne = (bulletin.moyenne_generale ?? 0).toFixed(2)
    const rang = bulletin.rang || "-"
    const matricule = (eleve as any)?.matricule || ""
    const dateNaiss = (eleve as any)?.date_naissance ? format(new Date((eleve as any).date_naissance), "dd/MM/yyyy") : ""
    const lieuNaiss = (eleve as any)?.lieu_naissance || ""
    const sexe = (eleve as any)?.sexe || ""
    const nationalite = (eleve as any)?.nationalite || "Ivoirienne"
    const today = format(new Date(), "EEEE dd MMMM yyyy", { locale: fr })
    const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
    const mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
    const d = new Date()
    const dateStr = `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`

    const lignesNotes = (notesData || []).map((n: any) => ({
      matiere: n.evaluation?.matiere?.libelle || "",
      moy: (n.valeur ?? 0).toFixed(2).replace(".", ","),
      coeff: n.evaluation?.coefficient || 1,
      mCoef: ((n.valeur ?? 0) * (n.evaluation?.coefficient || 1)).toFixed(2).replace(".", ","),
      prof: "",
      appr: n.appreciation || "",
    }))

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 8px; color: #000; margin: 5px; padding: 0; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #000; padding: 1px 3px; font-size: 8px; vertical-align: top; }
  .c { text-align: center; }
  .r { text-align: right; }
  .b { font-weight: bold; }
  .bg-gray { background-color: #eee; }
  .checkbox { border: 1px solid #000; width: 10px; height: 10px; display: inline-block; margin-right: 3px; vertical-align: middle; }
</style></head><body>

<!-- 1. EN-TETE -->
<table>
  <tr>
    <td style="width:70px; text-align:center; vertical-align:middle;">
      <div style="width:45px; height:45px; border:1px solid #000; margin:auto; display:flex; align-items:center; justify-content:center; font-size:7px;">LOGO<br>CACHET</div>
    </td>
    <td style="text-align:center; vertical-align:middle;">
      <div style="font-size:9px; font-weight:bold;">REPUBLIQUE DE CÔTE D'IVOIRE</div>
      <div style="font-size:7px;">MINISTERE DE L'EDUCATION NATIONALE<br>ET DE L'ENSEIGNEMENT TECHNIQUE</div>
      <div style="font-size:8px; font-weight:bold;">Lycée Classique d'Abidjan</div>
    </td>
    <td style="width:130px; font-size:7px; vertical-align:top;">
      Adresse : BP 39 ABIDJAN 08<br>
      Téléphone : 22443517<br>
      E-mail :<br>lyceeclassique@drenabidjan1.net<br>
      Code : 000395<br>
      Statut : Public
    </td>
  </tr>
</table>

<!-- 2. TITRE -->
<table style="margin-top:4px;">
  <tr>
    <td class="c" style="padding:4px;">
      <div style="font-size:12px; font-weight:bold;">BULLETIN PROVISOIRE</div>
      <div style="font-size:9px;">Trimestre ${trim} - Année scolaire 2025-2026</div>
    </td>
  </tr>
</table>

<!-- 3. IDENTITE ELEVE -->
<table style="margin-top:4px;">
  <tr>
    <td colspan="5" style="font-weight:bold; font-size:10px;">${nom}</td>
    <td style="width:15%;" class="r">Matricule : ${matricule}</td>
  </tr>
  <tr>
    <td style="width:13%;">Classe : <span class="b">${classe}</span></td>
    <td style="width:10%;">Effectif : <span class="b">0</span></td>
    <td style="width:10%;">Sexe : <span class="b">${sexe === "M" ? "M" : sexe === "F" ? "F" : ""}</span></td>
    <td style="width:13%;">Nationalité : <span class="b">${nationalite}</span></td>
    <td style="width:15%;">Né(e) le : <span class="b">${dateNaiss}</span></td>
    <td style="width:13%;">à : <span class="b">${lieuNaiss}</span></td>
  </tr>
  <tr>
    <td>Redoublant : <span class="b">Non</span></td>
    <td>Affecté(e) : <span class="b">Oui</span></td>
    <td colspan="4" class="c b" style="font-size:10px;">Année Scolaire 2025-2026</td>
  </tr>
</table>

<!-- 4. TABLEAU NOTES -->
<table style="margin-top:4px;">
  <tr class="bg-gray">
    <th style="width:22%;">MATIERE</th>
    <th style="width:8%;">MOY</th>
    <th style="width:7%;">COEFF</th>
    <th style="width:10%;">MoyXCoeff</th>
    <th style="width:7%;">RANG</th>
    <th style="width:15%;">PROFESSEUR</th>
    <th style="width:31%;">APPRECIATION / EMARGEMENT</th>
  </tr>
  ${lignesNotes.length > 0 ? lignesNotes.map((l: any) => `<tr>
    <td style="font-size:7px;">${l.matiere}</td>
    <td class="c" style="font-size:7px;">${l.moy}</td>
    <td class="c" style="font-size:7px;">${l.coeff}</td>
    <td class="c" style="font-size:7px;">${l.mCoef}</td>
    <td class="c" style="font-size:7px;">-</td>
    <td style="font-size:7px;"></td>
    <td style="font-size:7px;">${l.appr}</td>
  </tr>`).join("") : `<tr><td colspan="7" class="c" style="padding:8px; font-size:8px;">Aucune note saisie</td></tr>`}
  <tr>
    <td colspan="2" class="b" style="font-size:7px;">TOTAUX</td>
    <td class="c b" style="font-size:7px;">${lignesNotes.reduce((s: number, l: any) => s + l.coeff, 0)}</td>
    <td class="c b" style="font-size:7px;">${lignesNotes.reduce((s: number, l: any) => s + parseFloat(l.mCoef.replace(",", ".")), 0).toFixed(2).replace(".", ",")}</td>
    <td colspan="3" style="font-size:7px;"></td>
  </tr>
</table>

<!-- 5. MOYENNE + RANG -->
<table style="margin-top:4px;">
  <tr>
    <td class="b" style="font-size:9px;">MOY. TRIM. : ${moyenne.replace(".", ",")}/20 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; RANG : ${rang === "-" ? "-" : rang + "e"}/--</td>
  </tr>
</table>

<!-- 6. ABSENCES -->
<table style="margin-top:4px;">
  <tr>
    <td style="font-size:7px;">
      Absences justifiées : 0 Heure(s) &nbsp;&nbsp;&nbsp;&nbsp; Absences non justifiées : 0 Heure(s) &nbsp;&nbsp;&nbsp;&nbsp; Appréciations :
    </td>
  </tr>
</table>

<!-- 7. 3 BLOCS: Résultat / Distinctions / Sanctions -->
<table style="margin-top:4px;">
  <tr>
    <td style="width:33%; vertical-align:top;">
      <table>
        <tr><td class="b bg-gray" style="font-size:7px;">Résultat Trimestriel</td></tr>
        <tr><td style="font-size:7px;">
          Plus forte moyenne : --/20<br>
          Plus faible Moyenne : --/20<br>
          Moyenne Classe : --/20
        </td></tr>
      </table>
    </td>
    <td style="width:33%; vertical-align:top;">
      <table>
        <tr><td class="b bg-gray" style="font-size:7px;">Distinctions</td></tr>
        <tr><td style="font-size:7px;">
          <div><span class="checkbox"></span>Tableau d'honneur</div>
          <div><span class="checkbox"></span>Refusé</div>
          <div><span class="checkbox"></span>T. d'honneur + Encouragement</div>
          <div><span class="checkbox"></span>T. d'honneur + Félicitations</div>
        </td></tr>
      </table>
    </td>
    <td style="width:33%; vertical-align:top;">
      <table>
        <tr><td class="b bg-gray" style="font-size:7px;">Sanctions</td></tr>
        <tr><td style="font-size:7px;">
          <div><span class="checkbox"></span>Avertissement travail insuffisant</div>
          <div><span class="checkbox"></span>Blâme pour Travail insuffisant</div>
          <div><span class="checkbox"></span>Avertissement pour mauvaise Conduite</div>
          <div><span class="checkbox"></span>Blâme pour mauvaise Conduite</div>
        </td></tr>
      </table>
    </td>
  </tr>
</table>

<!-- 8. 3 BLOCS BAS: Rappel / Appréciation / Visa -->
<table style="margin-top:4px;">
  <tr>
    <td style="width:33%; vertical-align:top;">
      <table>
        <tr><td class="b bg-gray" style="font-size:7px;">Rappel</td></tr>
        <tr><td style="font-size:7px;">
          Moy 1er Trim : --<br>
          Rang : --
        </td></tr>
      </table>
    </td>
    <td style="width:34%; vertical-align:top;">
      <table style="height:100%;">
        <tr><td class="b bg-gray" style="font-size:7px;">Appréciation du Conseil de classe</td></tr>
        <tr><td style="font-size:7px; font-style:italic;">
          ${bulletin.appreciation || "Résultat passable, peut mieux faire !"}
        </td></tr>
        <tr><td style="font-size:7px;">
          Le Professeur Principal :<br>
          <div style="height:15px;"></div>
          ${profile?.nom ? "M. " + profile.nom : ""}
        </td></tr>
      </table>
    </td>
    <td style="width:33%; vertical-align:top;">
      <table style="height:100%;">
        <tr><td class="b bg-gray" style="font-size:7px;">VISA DU CHEF D'ETABLISSEMENT</td></tr>
        <tr><td style="font-size:7px;">
          ABIDJAN, le ${dateStr}<br>
          Le Proviseur
          <div style="width:40px; height:40px; border:2px solid #000; border-radius:50%; margin:2px auto; display:flex; align-items:center; justify-content:center; font-size:6px;">CACHET<br>DE<br>L'ETABLISSEMENT</div>
          <div style="height:4px;"></div>
          <div style="border:1px solid #000; padding:1px; text-align:center; font-size:6px; letter-spacing:1px;">||||||||||</div>
        </td></tr>
      </table>
    </td>
  </tr>
</table>

<!-- 9. PIED DE PAGE -->
<table style="margin-top:4px;">
  <tr>
    <td style="width:30%; font-size:7px;">Lycée Classique d'Abidjan</td>
    <td style="width:40%; font-size:7px; text-align:center;">EduGest CI, le logiciel de référence des Lycées et Collèges d'excellence</td>
    <td style="width:30%; font-size:7px; text-align:right;">Imprimé le ${dateStr}</td>
  </tr>
</table>

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
      doc.save(`bulletin-${bulletin.eleve?.prenom || ""}-${bulletin.eleve?.nom || ""}-T${bulletin.trimestre}.pdf`)
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

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulletins</h2>
          <p className="text-sm text-gray-500">Génération et consultation des bulletins de notes</p>
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Trimestre</Label>
            <select className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm" value={trimestre} onChange={(e) => setTrimestre(e.target.value)}>
              <option value="1">Trimestre 1</option>
              <option value="2">Trimestre 2</option>
              <option value="3">Trimestre 3</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Classe</Label>
            <select className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm" value={classeId} onChange={(e) => setClasseId(e.target.value)}>
              <option value="">Sélectionner</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
            </select>
          </div>
          <Button onClick={generateBulletins} disabled={!classeId || generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            {generating ? "Génération..." : "Générer"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Bulletins</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Moyenne générale</p><p className="text-2xl font-bold text-blue-600">{stats.moyenne}/20</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Taux de réussite</p><p className="text-2xl font-bold text-green-600">{stats.reussite}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Bulletins</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead><TableHead>Classe</TableHead><TableHead>Trim.</TableHead>
                <TableHead>Moyenne</TableHead><TableHead>Rang</TableHead><TableHead>Appréciation</TableHead><TableHead>Date</TableHead><TableHead>PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bulletins.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  Aucun bulletin. Sélectionnez une classe et cliquez sur Générer.
                </TableCell></TableRow>
              ) : bulletins.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.eleve?.prenom} {b.eleve?.nom}</TableCell>
                  <TableCell>{b.classe?.libelle}</TableCell>
                  <TableCell><Badge variant="info">T{b.trimestre}</Badge></TableCell>
                  <TableCell className="font-bold">{(b.moyenne_generale ?? 0).toFixed(1)}/20</TableCell>
                  <TableCell>{b.rang ? `${b.rang}e` : "-"}</TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-xs truncate">{b.appreciation ?? "-"}</TableCell>
                  <TableCell className="text-xs text-gray-400">
                    {b.created_at ? format(new Date(b.created_at), "dd/MM/yyyy", { locale: fr }) : "-"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => downloadPdf(b)} title="Télécharger PDF">
                      <Download className="h-4 w-4 text-blue-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

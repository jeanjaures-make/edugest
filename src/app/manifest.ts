import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduGest CI - Gestion Scolaire",
    short_name: "EduGest",
    description: "Plateforme de gestion scolaire pour écoles privées de Côte d'Ivoire",
    start_url: "/connexion",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4F8EF7",
    orientation: "portrait-primary",
    categories: ["education", "productivity"],
    lang: "fr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Tableau de bord",
        url: "/dashboard",
        description: "Accéder au tableau de bord",
      },
      {
        name: "Mes enfants",
        url: "/parent",
        description: "Espace parents",
      },
    ],
  }
}

"use client"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background font-sans antialiased flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-destructive">Erreur</h1>
            <h2 className="text-xl font-semibold">Une erreur inattendue est survenue</h2>
            <p className="text-muted-foreground text-sm">
              {error.message || "Veuillez réessayer ou contacter le support si le problème persiste."}
            </p>
          </div>
          <Button onClick={reset} variant="default">
            Réessayer
          </Button>
        </div>
      </body>
    </html>
  )
}

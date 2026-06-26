import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-xl font-semibold">Page introuvable</h2>
          <p className="text-muted-foreground text-sm">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
        </div>
        <Button asChild variant="default">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  )
}

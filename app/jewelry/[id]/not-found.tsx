import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Bijou non trouvé</h1>
      <p className="text-muted-foreground mb-8">Le bijou que vous recherchez n'existe pas ou a été supprimé.</p>
      <Button asChild>
        <Link href="/catalog">Retour au catalogue</Link>
      </Button>
    </div>
  )
}

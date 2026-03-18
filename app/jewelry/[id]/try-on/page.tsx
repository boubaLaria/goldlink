import { notFound } from "next/navigation"
import prisma from "@/lib/db"
import { TryOnClient } from "./tryon-client"

export default async function TryOnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const jewelry = await prisma.jewelry.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      images: true,
      tryOnAvailable: true,
      tryOnType: true,
      tryOnImageUrl: true,
      owner: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  if (!jewelry || !jewelry.tryOnAvailable || !jewelry.tryOnImageUrl) {
    notFound()
  }

  return <TryOnClient jewelry={jewelry as any} />
}

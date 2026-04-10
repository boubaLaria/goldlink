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
      type: true,
      images: true,
      model3dUrl: true,
      owner: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  if (!jewelry) {
    notFound()
  }

  return <TryOnClient jewelry={jewelry as any} />
}

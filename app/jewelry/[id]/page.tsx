import { notFound } from "next/navigation"
import { JewelryDetailClient } from "./jewelry-detail-client"
import prisma from "@/lib/db"

export default async function JewelryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const jewelry = await prisma.jewelry.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          rating: true,
          verified: true,
        },
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })

  if (!jewelry) {
    notFound()
  }

  await prisma.jewelry.update({
    where: { id },
    data: { views: { increment: 1 } },
  })

  return <JewelryDetailClient jewelry={jewelry} />
}

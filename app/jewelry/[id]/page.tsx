"use client"
import { notFound } from "next/navigation"
import { JewelryDetailClient } from "./jewelry-detail-client"
import { mockJewelry, mockUsers, mockReviews } from "@/lib/mock-data"

export default async function JewelryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const item = mockJewelry.find((j) => j.id === id)
  const owner = item ? mockUsers.find((u) => u.id === item.ownerId) : null
  const itemReviews = item ? mockReviews.filter((r) => r.targetId === item.id && r.targetType === "jewelry") : []

  if (!item || !owner) {
    notFound()
  }

  return <JewelryDetailClient item={item} owner={owner} itemReviews={itemReviews} />
}

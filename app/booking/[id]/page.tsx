"use client"
import { notFound } from "next/navigation"
import { BookingClient } from "./booking-client"
import { mockJewelry } from "@/lib/mock-data"

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const item = mockJewelry.find((j) => j.id === id)

  if (!item || !item.rentPricePerDay) {
    notFound()
  }

  return <BookingClient item={item} />
}

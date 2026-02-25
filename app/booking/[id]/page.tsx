import { notFound } from "next/navigation"
import { BookingClient } from "./booking-client"
import prisma from "@/lib/db"

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const jewelry = await prisma.jewelry.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      location: true,
      rentPricePerDay: true,
      estimatedValue: true,
      listingTypes: true,
      available: true,
    },
  })

  if (!jewelry || !jewelry.listingTypes.includes("RENT") || !jewelry.rentPricePerDay) {
    notFound()
  }

  return <BookingClient item={jewelry} />
}

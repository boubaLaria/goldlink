import type { Booking } from '@/lib/hooks/use-bookings'

export function normalizeBooking(booking: any): Booking {
  return {
    ...booking,
    status: booking.status?.toLowerCase(),
    startDate: booking.startDate instanceof Date ? booking.startDate.toISOString() : booking.startDate,
    endDate: booking.endDate instanceof Date ? booking.endDate.toISOString() : booking.endDate,
    createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
  }
}

export function normalizeBookingJewelry(jewelry: any) {
  return {
    id: jewelry?.id ?? '',
    title: jewelry?.title ?? '',
    images: jewelry?.images ?? [],
    type: jewelry?.type?.toLowerCase() ?? '',
    location: jewelry?.location ?? '',
    ownerId: jewelry?.ownerId ?? '',
    description: '',
    weight: 0,
    purity: 18,
    estimatedValue: 0,
    listingType: [],
    available: true,
    views: 0,
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
  }
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  active: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  dispute: 'Litige',
}

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  active: 'bg-green-500/10 text-green-700 dark:text-green-400',
  completed: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400',
  dispute: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
}

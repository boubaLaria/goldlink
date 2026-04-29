export const CHART_COLORS = ["#C8922A", "#D4AF37", "#8B6914", "#EDCD82", "#5C4A1E"]

export const CHART_TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
}

export function buildMonthlyRevenue(bookings: any[]): { month: string; revenue: number }[] {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    months[key] = 0
  }
  bookings.forEach((b) => {
    if (b.status !== "COMPLETED") return
    const d = new Date(b.createdAt)
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
    if (diff < 0 || diff > 5) return
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    if (key in months) months[key] += b.totalPrice
  })
  return Object.entries(months).map(([month, revenue]) => ({ month, revenue }))
}

export function buildBookingsByMonth(bookings: any[]): { month: string; count: number }[] {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    months[key] = 0
  }
  bookings.forEach((b) => {
    const d = new Date(b.createdAt)
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
    if (diff < 0 || diff > 5) return
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    if (key in months) months[key]++
  })
  return Object.entries(months).map(([month, count]) => ({ month, count }))
}

const JEWELRY_TYPE_LABELS: Record<string, string> = {
  NECKLACE: "Collier", BRACELET: "Bracelet", RING: "Bague",
  EARRINGS: "Boucles", PENDANT: "Pendentif", CHAIN: "Chaîne",
}

export function buildJewelryByType(jewelry: any[]): { name: string; value: number }[] {
  const counts: Record<string, number> = {}
  jewelry.forEach((j) => {
    const label = JEWELRY_TYPE_LABELS[j.type] ?? j.type
    counts[label] = (counts[label] ?? 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

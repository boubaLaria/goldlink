export const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
}

export function buildMonthlyData(
  bookings: any[],
  userId: string,
  asOwner: boolean
): { month: string; revenue: number; count: number }[] {
  const months: Record<string, { month: string; revenue: number; count: number }> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    months[key] = { month: key, revenue: 0, count: 0 }
  }
  bookings.forEach((b) => {
    const relevant = asOwner ? b.ownerId === userId : b.renterId === userId
    if (!relevant) return
    const d = new Date(b.createdAt)
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth()
    if (diff < 0 || diff > 5) return
    const key = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" })
    if (months[key]) {
      months[key].count++
      if (b.status === "COMPLETED") months[key].revenue += b.totalPrice
    }
  })
  return Object.values(months)
}

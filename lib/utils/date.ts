export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return "Date invalide"
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateObj)
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return "Date invalide"
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj)
}

export function calculateDaysBetween(start: Date | string, end: Date | string): number {
  const startObj = typeof start === "string" ? new Date(start) : start
  const endObj = typeof end === "string" ? new Date(end) : end

  const diffTime = Math.abs(endObj.getTime() - startObj.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

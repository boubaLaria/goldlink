export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)}g`
}

export function formatPurity(purity: number): string {
  return `${purity}K`
}

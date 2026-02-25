export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatPriceWithCurrency(
  price: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    // Fallback if currency code is invalid
    return new Intl.NumberFormat('fr-FR', {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }
}

export function getCurrencyLocale(currency: string = 'EUR'): string {
  const localeMap: Record<string, string> = {
    'EUR': 'fr-FR',
    'USD': 'en-US',
    'GBP': 'en-GB',
    'MAD': 'fr-MA',
    'AED': 'ar-AE',
    'SAR': 'ar-SA',
  }
  return localeMap[currency] || 'fr-FR'
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)}g`
}

export function formatPurity(purity: number): string {
  return `${purity}K`
}

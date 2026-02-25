import type { Jewelry } from '@/lib/hooks/use-jewelry'

export const JEWELRY_TYPE_LABELS: Record<string, string> = {
  NECKLACE: 'Collier',
  BRACELET: 'Bracelet',
  RING: 'Bague',
  EARRINGS: "Boucles d'oreilles",
  PENDANT: 'Pendentif',
  CHAIN: 'Chaîne',
}

export const JEWELRY_TYPES = [
  { value: 'NECKLACE', label: 'Collier' },
  { value: 'BRACELET', label: 'Bracelet' },
  { value: 'RING', label: 'Bague' },
  { value: 'EARRINGS', label: "Boucles d'oreilles" },
  { value: 'PENDANT', label: 'Pendentif' },
  { value: 'CHAIN', label: 'Chaîne' },
]

export const PURITY_OPTIONS = [
  { value: 'K8', label: '8K' },
  { value: 'K10', label: '10K' },
  { value: 'K14', label: '14K' },
  { value: 'K18', label: '18K' },
  { value: 'K22', label: '22K' },
  { value: 'K24', label: '24K' },
]

export const LOCATIONS = [
  'Paris',
  'Lyon',
  'Marseille',
  'Toulouse',
  'Nice',
  'Bordeaux',
  'Strasbourg',
  'Nantes',
  'Lille',
  'Rennes',
]

export const CURRENCIES = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'Dollar US ($)' },
  { value: 'GBP', label: 'Livre sterling (£)' },
  { value: 'MAD', label: 'Dirham marocain (MAD)' },
  { value: 'AED', label: 'Dirham émirati (AED)' },
  { value: 'SAR', label: 'Riyal saoudien (SAR)' },
]

export const COUNTRIES = [
  { value: 'France', label: 'France' },
  { value: 'Belgique', label: 'Belgique' },
  { value: 'Suisse', label: 'Suisse' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Maroc', label: 'Maroc' },
  { value: 'Algérie', label: 'Algérie' },
  { value: 'Tunisie', label: 'Tunisie' },
  { value: 'Émirats arabes unis', label: 'Émirats arabes unis' },
  { value: 'Arabie saoudite', label: 'Arabie saoudite' },
]

export function getJewelryTypeLabel(type: string): string {
  return JEWELRY_TYPE_LABELS[type] ?? type
}

export function buildJewelryPayload(formData: {
  title: string
  description: string
  type: string
  weight: string
  purity: string
  estimatedValue: string
  location: string
  country: string
  currency: string
  listingTypes: string[]
  rentPricePerDay: string
  salePrice: string
  images: string[]
}) {
  return {
    title: formData.title,
    description: formData.description,
    type: formData.type,
    weight: parseFloat(formData.weight),
    purity: formData.purity,
    estimatedValue: parseFloat(formData.estimatedValue),
    location: formData.location,
    country: formData.country,
    currency: formData.currency,
    listingTypes: formData.listingTypes,
    images: formData.images,
    rentPricePerDay: formData.listingTypes.includes('RENT') && formData.rentPricePerDay
      ? parseFloat(formData.rentPricePerDay)
      : undefined,
    salePrice: formData.listingTypes.includes('SALE') && formData.salePrice
      ? parseFloat(formData.salePrice)
      : undefined,
  }
}

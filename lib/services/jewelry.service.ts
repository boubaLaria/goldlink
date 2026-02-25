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
  'Casablanca',
  'Marrakech',
  'Rabat',
  'Fès',
  'Tanger',
  'Agadir',
  'Meknès',
  'Oujda',
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

import { GOLD_PRICE_PER_GRAM } from "../mock-data"

export function calculateGoldValue(weight: number, purity: number): number {
  const pricePerGram = GOLD_PRICE_PER_GRAM[purity as keyof typeof GOLD_PRICE_PER_GRAM] || 500
  return weight * pricePerGram
}

export function calculateCommercialValue(goldValue: number, purity: number): number {
  // Commercial value includes craftsmanship, design, brand, etc.
  // Higher purity typically has lower markup
  const markup = purity === 24 ? 1.2 : purity === 22 ? 1.4 : 1.6
  return goldValue * markup
}

export function generateEstimation(weight: number, purity: number, hasImages = false) {
  const goldValue = calculateGoldValue(weight, purity)
  const commercialValue = calculateCommercialValue(goldValue, purity)

  // Confidence based on available information
  let confidence = 0.7
  if (hasImages) confidence += 0.15
  if (weight > 0) confidence += 0.1
  if (purity > 0) confidence += 0.05

  return {
    estimatedGoldValue: Math.round(goldValue),
    estimatedCommercialValue: Math.round(commercialValue),
    confidence: Math.min(confidence, 0.95),
  }
}

import prisma from "@/lib/db"

type JewelrySearchFilters = {
  maxRentPricePerDay?: number
  minRentPricePerDay?: number
  maxSalePrice?: number
  minSalePrice?: number
  purity?: "K8" | "K10" | "K14" | "K18" | "K22" | "K24"
  type?: "NECKLACE" | "BRACELET" | "RING" | "EARRINGS" | "PENDANT" | "CHAIN"
  location?: string
  mode?: "rent" | "sale"
}

const TYPE_MAP: Array<{ pattern: RegExp; value: JewelrySearchFilters["type"] }> = [
  { pattern: /\bbague?s?\b/i, value: "RING" },
  { pattern: /\bbracelet?s?\b/i, value: "BRACELET" },
  { pattern: /\bcollier?s?\b/i, value: "NECKLACE" },
  { pattern: /\bboucles?\b|\bboucles d[’']oreilles\b/i, value: "EARRINGS" },
  { pattern: /\bpendentif?s?\b/i, value: "PENDANT" },
  { pattern: /\bchaine?s?\b/i, value: "CHAIN" },
]

function normalizeText(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function extractBudget(input: string) {
  const text = normalizeText(input)
  const underMatch =
    text.match(/(?:ne depasse pas|moins de|inferieur a|max(?:imum)?|au maximum|pas plus de)\s*(\d+(?:[.,]\d+)?)/i) ||
    text.match(/(\d+(?:[.,]\d+)?)\s*(?:euros|euro|€)\s*(?:max|maximum)?/i)

  const minMatch = text.match(/(?:plus de|minimum|min)\s*(\d+(?:[.,]\d+)?)/i)

  const toNumber = (value?: string) => {
    if (!value) return undefined
    return Number(value.replace(",", "."))
  }

  return {
    max: toNumber(underMatch?.[1]),
    min: toNumber(minMatch?.[1]),
  }
}

export function extractJewelrySearchFilters(question: string): JewelrySearchFilters | null {
  const text = normalizeText(question)

  const mode: JewelrySearchFilters["mode"] =
    /\b(location|louer|location|par jour|jour)\b/i.test(text)
      ? "rent"
      : /\b(acheter|achat|vente)\b/i.test(text)
        ? "sale"
        : undefined

  const budget = extractBudget(question)
  const purityMatch = text.match(/\b(8|10|14|18|22|24)\s*k\b/)
  const locationMatch = text.match(/\b(?:a|à|au|aux|en)\s+([a-zA-ZÀ-ÿ-]{3,})\b/)
  const typeMatch = TYPE_MAP.find((entry) => entry.pattern.test(question))

  const filters: JewelrySearchFilters = {
    mode,
    type: typeMatch?.value,
    purity: purityMatch ? (`K${purityMatch[1]}` as JewelrySearchFilters["purity"]) : undefined,
    location: locationMatch?.[1],
  }

  if (mode === "sale") {
    filters.maxSalePrice = budget.max
    filters.minSalePrice = budget.min
  } else {
    filters.maxRentPricePerDay = budget.max
    filters.minRentPricePerDay = budget.min
  }

  const hasSignal =
    filters.mode ||
    filters.type ||
    filters.purity ||
    filters.location ||
    filters.maxRentPricePerDay !== undefined ||
    filters.maxSalePrice !== undefined ||
    filters.minRentPricePerDay !== undefined ||
    filters.minSalePrice !== undefined

  return hasSignal ? filters : null
}

export async function searchJewelryForChat(question: string) {
  const filters = extractJewelrySearchFilters(question)
  if (!filters) {
    return { filters: null, results: [] }
  }

  const where: any = {
    available: true,
  }

  if (filters.type) where.type = filters.type
  if (filters.purity) where.purity = filters.purity
  if (filters.location) {
    where.location = {
      contains: filters.location,
      mode: "insensitive",
    }
  }

  if (filters.mode === "sale") {
    where.listingTypes = { has: "SALE" }
    where.salePrice = {}
    if (filters.minSalePrice !== undefined) where.salePrice.gte = filters.minSalePrice
    if (filters.maxSalePrice !== undefined) where.salePrice.lte = filters.maxSalePrice
  } else {
    where.listingTypes = { has: "RENT" }
    where.rentPricePerDay = {}
    if (filters.minRentPricePerDay !== undefined) where.rentPricePerDay.gte = filters.minRentPricePerDay
    if (filters.maxRentPricePerDay !== undefined) where.rentPricePerDay.lte = filters.maxRentPricePerDay
  }

  const results = await prisma.jewelry.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          rating: true,
          verified: true,
        },
      },
    },
    take: 6,
    orderBy: [
      { rating: "desc" },
      { createdAt: "desc" },
    ],
  })

  return {
    filters,
    results: results.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      images: item.images,
      type: item.type,
      weight: item.weight,
      purity: Number(item.purity.replace("K", "")),
      listingType: item.listingTypes.map((entry) => entry.toLowerCase()),
      rentPricePerDay: item.rentPricePerDay,
      salePrice: item.salePrice,
      available: item.available,
      location: item.location,
      rating: item.rating,
      reviewCount: item.reviewCount,
      currency: item.currency,
      owner: item.owner,
    })),
  }
}

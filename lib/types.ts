// Core types for the GoldLink platform

export type UserRole = "buyer" | "seller" | "jeweler" | "admin"

export type TryOnType = "FACE" | "NECK" | "WRIST" | "FINGER" | "MULTI"
export type TryOnMode = "WEBCAM" | "UPLOAD"
export type TryOnSessionStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED"

export type JewelryType = "necklace" | "bracelet" | "ring" | "earrings" | "pendant" | "chain"

export type ListingType = "rent" | "sale" | "exchange"

export type BookingStatus = "pending" | "confirmed" | "active" | "completed" | "cancelled"

export type TransactionStatus = "pending" | "completed" | "refunded" | "disputed"

export type MessageStatus = "sent" | "read"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  role: UserRole
  avatar?: string
  verified: boolean
  rating: number
  reviewCount: number
  createdAt: Date
  address?: string
  cin?: string
  country?: string
  currency?: string
}

export interface Jewelry {
  id: string
  ownerId: string
  title: string
  description: string
  images: string[]
  type: JewelryType
  weight: number // in grams
  purity: number // in carats (e.g., 18, 22, 24)
  dimensions?: string
  estimatedValue: number
  listingType: ListingType[]
  rentPricePerDay?: number
  salePrice?: number
  available: boolean
  availableDates?: Date[]
  location: string
  country?: string
  currency?: string
  createdAt: Date
  views: number
  rating: number
  reviewCount: number
  tryOnAvailable: boolean
  tryOnType?: TryOnType
  tryOnImageUrl?: string
}

export interface Booking {
  id: string
  jewelryId: string
  renterId: string
  ownerId: string
  startDate: Date
  endDate: Date
  totalPrice: number
  deposit: number
  status: BookingStatus
  createdAt: Date
  insurance?: boolean
}

export interface Transaction {
  id: string
  bookingId?: string
  jewelryId?: string
  buyerId: string
  sellerId: string
  amount: number
  commission: number
  status: TransactionStatus
  type: "rent" | "sale" | "deposit" | "refund"
  createdAt: Date
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  images?: string[]
  status: MessageStatus
  createdAt: Date
  conversationId: string
}

export interface Conversation {
  id: string
  participants: string[]
  lastMessage?: Message
  updatedAt: Date
}

export interface Review {
  id: string
  userId: string
  targetId: string // jewelry or user id
  targetType: "jewelry" | "user"
  rating: number
  comment: string
  createdAt: Date
}

export interface Estimation {
  id: string
  userId: string
  images: string[]
  weight?: number
  purity?: number
  estimatedGoldValue: number
  estimatedCommercialValue: number
  confidence: number
  certified: boolean
  createdAt: Date
}

export interface TryOnSession {
  id: string
  userId: string
  jewelryId: string
  jewelry?: Jewelry
  mode: TryOnMode
  status: TryOnSessionStatus
  inputImageUrl?: string
  outputImageUrl?: string
  comfyPromptId?: string
  createdAt: Date
  updatedAt: Date
}

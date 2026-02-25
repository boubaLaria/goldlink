"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Jewelry, Booking, Transaction, Message, Conversation, Review, Estimation } from "./types"

interface AppState {
  // Current user
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Users
  users: User[]
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void

  // Jewelry
  jewelry: Jewelry[]
  addJewelry: (item: Jewelry) => void
  updateJewelry: (id: string, updates: Partial<Jewelry>) => void
  deleteJewelry: (id: string) => void

  // Bookings
  bookings: Booking[]
  addBooking: (booking: Booking) => void
  updateBooking: (id: string, updates: Partial<Booking>) => void

  // Transactions
  transactions: Transaction[]
  addTransaction: (transaction: Transaction) => void

  // Messages
  messages: Message[]
  conversations: Conversation[]
  addMessage: (message: Message) => void
  markMessageAsRead: (id: string) => void

  // Reviews
  reviews: Review[]
  addReview: (review: Review) => void

  // Estimations
  estimations: Estimation[]
  addEstimation: (estimation: Estimation) => void

  // Filters
  searchQuery: string
  setSearchQuery: (query: string) => void
  filters: {
    type?: string
    minPrice?: number
    maxPrice?: number
    purity?: number
    location?: string
  }
  setFilters: (filters: any) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Current user
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // Users
      users: [],
      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        })),

      // Jewelry
      jewelry: [],
      addJewelry: (item) => set((state) => ({ jewelry: [...state.jewelry, item] })),
      updateJewelry: (id, updates) =>
        set((state) => ({
          jewelry: state.jewelry.map((j) => (j.id === id ? { ...j, ...updates } : j)),
        })),
      deleteJewelry: (id) =>
        set((state) => ({
          jewelry: state.jewelry.filter((j) => j.id !== id),
        })),

      // Bookings
      bookings: [],
      addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
      updateBooking: (id, updates) =>
        set((state) => ({
          bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      // Transactions
      transactions: [],
      addTransaction: (transaction) => set((state) => ({ transactions: [...state.transactions, transaction] })),

      // Messages
      messages: [],
      conversations: [],
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      markMessageAsRead: (id) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, status: "read" as const } : m)),
        })),

      // Reviews
      reviews: [],
      addReview: (review) => set((state) => ({ reviews: [...state.reviews, review] })),

      // Estimations
      estimations: [],
      addEstimation: (estimation) => set((state) => ({ estimations: [...state.estimations, estimation] })),

      // Filters
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),
      filters: {},
      setFilters: (filters) => set({ filters }),
    }),
    {
      name: "goldlink-storage",
    },
  ),
)

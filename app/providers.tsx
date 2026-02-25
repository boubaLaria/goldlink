"use client"

import type React from "react"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { mockUsers, mockJewelry, mockBookings, mockTransactions, mockReviews } from "@/lib/mock-data"

export function Providers({ children }: { children: React.ReactNode }) {
  const { users, jewelry, bookings, transactions, reviews } = useStore()

  useEffect(() => {
    // Initialize mock data only if store is empty
    if (users.length === 0) {
      mockUsers.forEach((user) => useStore.getState().addUser(user))
    }
    if (jewelry.length === 0) {
      mockJewelry.forEach((item) => useStore.getState().addJewelry(item))
    }
    if (bookings.length === 0) {
      mockBookings.forEach((booking) => useStore.getState().addBooking(booking))
    }
    if (transactions.length === 0) {
      mockTransactions.forEach((transaction) => useStore.getState().addTransaction(transaction))
    }
    if (reviews.length === 0) {
      mockReviews.forEach((review) => useStore.getState().addReview(review))
    }
  }, [])

  return <>{children}</>
}

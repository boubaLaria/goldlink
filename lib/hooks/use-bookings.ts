'use client'

import { useState, useCallback } from 'react'
import apiClient from '@/lib/api-client'

export interface Booking {
  id: string
  jewelryId: string
  renterId: string
  ownerId: string
  startDate: string
  endDate: string
  totalPrice: number
  deposit: number
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTE'
  insurance: boolean
  jewelry?: any
  renter?: any
  owner?: any
  createdAt: string
  updatedAt: string
}

export interface UseBookingsReturn {
  bookings: Booking[]
  loading: boolean
  error: string | null
  list: (filters?: any) => Promise<void>
  getById: (id: string) => Promise<Booking | null>
  create: (data: any) => Promise<Booking>
  updateStatus: (id: string, status: string) => Promise<Booking>
}

export function useBookings(): UseBookingsReturn {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/api/bookings', { params: filters })
      setBookings(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [])

  const getById = useCallback(async (id: string): Promise<Booking | null> => {
    try {
      setLoading(true)
      setError(null)
      return await apiClient.get(`/api/bookings/${id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch booking')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: any): Promise<Booking> => {
    try {
      setLoading(true)
      setError(null)
      const newBooking = await apiClient.post('/api/bookings', data)
      setBookings((prev) => [newBooking, ...prev])
      return newBooking
    } catch (err: any) {
      setError(err.message || 'Failed to create booking')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStatus = useCallback(async (id: string, status: string): Promise<Booking> => {
    try {
      setLoading(true)
      setError(null)
      const updated = await apiClient.patch(`/api/bookings/${id}`, { status })
      setBookings((prev) =>
        prev.map((booking) => (booking.id === id ? updated : booking))
      )
      return updated
    } catch (err: any) {
      setError(err.message || 'Failed to update booking')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    bookings,
    loading,
    error,
    list,
    getById,
    create,
    updateStatus,
  }
}

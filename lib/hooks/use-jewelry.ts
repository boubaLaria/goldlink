'use client'

import { useState, useCallback } from 'react'
import apiClient from '@/lib/api-client'

export interface Jewelry {
  id: string
  title: string
  description: string
  images: string[]
  type: 'NECKLACE' | 'BRACELET' | 'RING' | 'EARRINGS' | 'PENDANT' | 'CHAIN'
  weight: number
  purity: 'K8' | 'K10' | 'K14' | 'K18' | 'K22' | 'K24'
  estimatedValue: number
  listingTypes: ('RENT' | 'SALE' | 'EXCHANGE')[]
  rentPricePerDay?: number
  salePrice?: number
  available: boolean
  location: string
  views: number
  rating: number
  reviewCount: number
  owner?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
    rating: number
  }
  createdAt: string
  updatedAt: string
}

interface JewelryFilters {
  type?: string
  purity?: string
  minPrice?: number
  maxPrice?: number
  location?: string
  search?: string
  limit?: number
  skip?: number
}

export interface UseJewelryReturn {
  jewelry: Jewelry[]
  total: number
  loading: boolean
  error: string | null
  list: (filters?: JewelryFilters) => Promise<void>
  getById: (id: string) => Promise<Jewelry | null>
  create: (data: any) => Promise<Jewelry>
  update: (id: string, data: any) => Promise<Jewelry>
  delete: (id: string) => Promise<void>
}

export function useJewelry(): UseJewelryReturn {
  const [jewelry, setJewelry] = useState<Jewelry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = useCallback(async (filters: JewelryFilters = {}) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/api/jewelry', { params: filters })
      setJewelry(response.data)
      setTotal(response.pagination.total)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jewelry')
      setJewelry([])
    } finally {
      setLoading(false)
    }
  }, [])

  const getById = useCallback(async (id: string): Promise<Jewelry | null> => {
    try {
      setLoading(true)
      setError(null)
      return await apiClient.get(`/api/jewelry/${id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jewelry')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: any): Promise<Jewelry> => {
    try {
      setLoading(true)
      setError(null)
      const newItem = await apiClient.post('/api/jewelry', data)
      setJewelry((prev) => [newItem, ...prev])
      return newItem
    } catch (err: any) {
      setError(err.message || 'Failed to create jewelry')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (id: string, data: any): Promise<Jewelry> => {
    try {
      setLoading(true)
      setError(null)
      const updated = await apiClient.patch(`/api/jewelry/${id}`, data)
      setJewelry((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      )
      return updated
    } catch (err: any) {
      setError(err.message || 'Failed to update jewelry')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await apiClient.delete(`/api/jewelry/${id}`)
      setJewelry((prev) => prev.filter((item) => item.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete jewelry')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    jewelry,
    total,
    loading,
    error,
    list,
    getById,
    create,
    update,
    delete: deleteItem,
  }
}

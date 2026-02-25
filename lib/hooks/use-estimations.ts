'use client'

import { useState, useCallback } from 'react'
import apiClient from '@/lib/api-client'

export interface Estimation {
  id: string
  userId: string
  images: string[]
  weight: number
  purity: 'K8' | 'K10' | 'K14' | 'K18' | 'K22' | 'K24'
  estimatedGoldValue: number
  estimatedCommercialValue: number
  confidence: number
  certified: boolean
  createdAt: string
}

export interface UseEstimationsReturn {
  estimations: Estimation[]
  loading: boolean
  error: string | null
  list: () => Promise<void>
  create: (data: any) => Promise<Estimation>
}

export function useEstimations(): UseEstimationsReturn {
  const [estimations, setEstimations] = useState<Estimation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/api/estimations')
      setEstimations(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch estimations')
      setEstimations([])
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: any): Promise<Estimation> => {
    try {
      setLoading(true)
      setError(null)
      const newEstimation = await apiClient.post('/api/estimations', data)
      setEstimations((prev) => [newEstimation, ...prev])
      return newEstimation
    } catch (err: any) {
      setError(err.message || 'Failed to create estimation')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    estimations,
    loading,
    error,
    list,
    create,
  }
}

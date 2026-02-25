'use client'

import { useState, useCallback } from 'react'
import apiClient from '@/lib/api-client'

export interface Review {
  id: string
  reviewerId: string
  targetId: string
  targetType: 'user' | 'jewelry'
  rating: number
  comment: string
  reviewer?: any
  createdAt: string
}

export interface UseReviewsReturn {
  reviews: Review[]
  loading: boolean
  error: string | null
  list: (targetId: string, targetType: 'user' | 'jewelry') => Promise<void>
  create: (data: any) => Promise<Review>
}

export function useReviews(): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = useCallback(async (targetId: string, targetType: 'user' | 'jewelry') => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/api/reviews', {
        params: { targetId, targetType },
      })
      setReviews(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (data: any): Promise<Review> => {
    try {
      setLoading(true)
      setError(null)
      const newReview = await apiClient.post('/api/reviews', data)
      setReviews((prev) => [newReview, ...prev])
      return newReview
    } catch (err: any) {
      setError(err.message || 'Failed to create review')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    reviews,
    loading,
    error,
    list,
    create,
  }
}

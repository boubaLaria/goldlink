'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api-client'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'BUYER' | 'SELLER' | 'JEWELER' | 'ADMIN'
  avatar?: string
  verified: boolean
  rating: number
  address?: string
  phone?: string
  cin?: string
  country?: string
  currency?: string
}

export interface UseAuthReturn {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string, role?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Load current user on mount
  useEffect(() => {
    const loadUser = async () => {
      // Only run on client side
      if (typeof window === 'undefined') return

      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('accessToken')
        : null

      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else if (response.status === 401) {
            // Token expired, try to refresh
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              })
              if (refreshResponse.ok) {
                const { accessToken: newToken } = await refreshResponse.json()
                localStorage.setItem('accessToken', newToken)
                // Retry loading user
                const retryResponse = await fetch('/api/auth/me', {
                  headers: {
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json',
                  },
                })
                if (retryResponse.ok) {
                  const userData = await retryResponse.json()
                  setUser(userData)
                } else {
                  localStorage.removeItem('accessToken')
                  localStorage.removeItem('refreshToken')
                }
              }
            } else {
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
            }
          }
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    role = 'BUYER'
  ) => {
    try {
      setLoading(true)
      const response = await apiClient.post('/api/auth/register', {
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
      })

      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      setUser(response.user)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      })

      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      setUser(response.user)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    router.push('/')
  }

  const refreshUser = async () => {
    try {
      const userData = await apiClient.get('/api/auth/me')
      setUser(userData)
    } catch (error) {
      setUser(null)
    }
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    refreshUser,
  }
}

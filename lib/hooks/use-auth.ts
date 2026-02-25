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
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const userData = await apiClient.get('/api/auth/me')
          setUser(userData)
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

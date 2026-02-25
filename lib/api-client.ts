/**
 * API Client with automatic JWT token management
 * Handles:
 * - Adding Authorization header
 * - Token refresh on 401
 * - Request/response logging in dev
 */

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null>
  headers?: Record<string, string>
}

export const apiClient = {
  async request(
    method: string,
    url: string,
    options: FetchOptions = {}
  ): Promise<Response> {
    const { params, headers = {}, ...restOptions } = options

    // Build URL with query params
    let fullUrl = url
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      fullUrl = queryString ? `${url}?${queryString}` : url
    }

    // Add auth token if available
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken')
      : null

    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    }

    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }

    const response = await fetch(fullUrl, {
      method,
      headers: finalHeaders,
      ...restOptions,
    })

    // Handle 401 (token expired) - attempt refresh
    if (response.status === 401 && typeof window !== 'undefined') {
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

          // Retry original request with new token
          finalHeaders.Authorization = `Bearer ${newToken}`
          return fetch(fullUrl, {
            method,
            headers: finalHeaders,
            ...restOptions,
          })
        } else {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      }
    }

    if (!response.ok) {
      const errorMessage = await response.text()
      throw new APIError(
        response.status,
        response.statusText,
        errorMessage
      )
    }

    return response
  },

  async get(url: string, options?: FetchOptions) {
    const response = await this.request('GET', url, options)
    return response.json()
  },

  async post(url: string, data?: unknown, options?: FetchOptions) {
    const response = await this.request('POST', url, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    })
    return response.json()
  },

  async patch(url: string, data?: unknown, options?: FetchOptions) {
    const response = await this.request('PATCH', url, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    })
    return response.json()
  },

  async put(url: string, data?: unknown, options?: FetchOptions) {
    const response = await this.request('PUT', url, {
      ...options,
      body: data ? JSON.stringify(data) : undefined,
    })
    return response.json()
  },

  async delete(url: string, options?: FetchOptions) {
    const response = await this.request('DELETE', url, options)
    try {
      return response.json()
    } catch {
      return { success: true }
    }
  },
}

export default apiClient

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import apiClient from '@/lib/api-client'
import { TryOnMode, TryOnSession, TryOnSessionStatus, TryOnType } from '@/lib/types'

const POLL_INTERVAL_MS = 2500

// ── Types ──────────────────────────────────────────────────────────────────

export interface TryOnServiceStatus {
  ollama: boolean
  diffusers: boolean
  fullFeatures: boolean
  previewOnly: boolean
}

export interface TryOnUploadResult {
  valid: boolean
  url?: string
  detectedType?: TryOnType
  confidence?: number
  typeMismatch?: boolean
  warnings: string[]
  errors: string[]
}

export interface UseTryOnReturn {
  // État des services IA
  serviceStatus: TryOnServiceStatus | null
  serviceStatusLoading: boolean

  // Session en cours
  session: TryOnSession | null
  sessionLoading: boolean

  // Historique
  history: TryOnSession[]
  historyLoading: boolean
  historyTotal: number

  // Erreurs
  error: string | null

  // Actions
  checkStatus: () => Promise<TryOnServiceStatus>
  start: (jewelryId: string, inputImage: string, mode: TryOnMode) => Promise<string>
  deleteSession: (sessionId: string) => Promise<void>
  getHistory: (filters?: { limit?: number; skip?: number }) => Promise<void>
  uploadTryOnImage: (file: File, declaredType?: TryOnType) => Promise<TryOnUploadResult>
  clearSession: () => void
  clearError: () => void
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useTryOn(): UseTryOnReturn {
  const [serviceStatus, setServiceStatus] = useState<TryOnServiceStatus | null>(null)
  const [serviceStatusLoading, setServiceStatusLoading] = useState(false)

  const [session, setSession] = useState<TryOnSession | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)

  const [history, setHistory] = useState<TryOnSession[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTotal, setHistoryTotal] = useState(0)

  const [error, setError] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Arrêt du polling ──────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Nettoyage au démontage
  useEffect(() => () => stopPolling(), [stopPolling])

  // ── Polling automatique quand une session est PENDING/PROCESSING ───────
  useEffect(() => {
    if (!session) return
    if (session.status === 'DONE' || session.status === 'FAILED') {
      stopPolling()
      return
    }
    if (session.status !== 'PENDING' && session.status !== 'PROCESSING') return

    // Démarrer le polling uniquement s'il n'est pas déjà actif
    if (pollRef.current) return

    pollRef.current = setInterval(async () => {
      try {
        const result = await apiClient.get(`/api/tryon/${session.id}`)
        setSession((prev) => (prev ? { ...prev, ...result } : result))

        const newStatus: TryOnSessionStatus = result.status
        if (newStatus === 'DONE' || newStatus === 'FAILED') {
          stopPolling()
        }
      } catch (err: any) {
        console.error('[useTryOn] Polling error:', err)
        // Ne pas stopper le polling sur erreur réseau temporaire
      }
    }, POLL_INTERVAL_MS)
  }, [session?.id, session?.status, stopPolling])

  // ── checkStatus ───────────────────────────────────────────────────────
  const checkStatus = useCallback(async (): Promise<TryOnServiceStatus> => {
    setServiceStatusLoading(true)
    try {
      const result: TryOnServiceStatus = await apiClient.get('/api/tryon/status')
      setServiceStatus(result)
      return result
    } catch {
      const fallback: TryOnServiceStatus = {
        ollama: false,
        diffusers: false,
        fullFeatures: false,
        previewOnly: true,
      }
      setServiceStatus(fallback)
      return fallback
    } finally {
      setServiceStatusLoading(false)
    }
  }, [])

  // ── start ─────────────────────────────────────────────────────────────
  const start = useCallback(
    async (jewelryId: string, inputImage: string, mode: TryOnMode): Promise<string> => {
      setSessionLoading(true)
      setError(null)
      stopPolling()

      try {
        const result = await apiClient.post('/api/tryon', {
          jewelryId,
          inputImage,
          mode,
        })

        const newSession: TryOnSession = {
          id: result.sessionId,
          userId: '',
          jewelryId,
          mode,
          status: result.status as TryOnSessionStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setSession(newSession)
        return result.sessionId
      } catch (err: any) {
        const message = err.message || 'Impossible de démarrer la session d\'essayage'
        setError(message)
        throw err
      } finally {
        setSessionLoading(false)
      }
    },
    [stopPolling]
  )

  // ── deleteSession ─────────────────────────────────────────────────────
  const deleteSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        await apiClient.delete(`/api/tryon/${sessionId}`)
        if (session?.id === sessionId) {
          stopPolling()
          setSession(null)
        }
        setHistory((prev) => prev.filter((s) => s.id !== sessionId))
        setHistoryTotal((prev) => Math.max(0, prev - 1))
      } catch (err: any) {
        setError(err.message || 'Impossible de supprimer la session')
        throw err
      }
    },
    [session, stopPolling]
  )

  // ── getHistory ────────────────────────────────────────────────────────
  const getHistory = useCallback(
    async (filters: { limit?: number; skip?: number } = {}): Promise<void> => {
      setHistoryLoading(true)
      setError(null)
      try {
        const result = await apiClient.get('/api/tryon/history', { params: filters })
        setHistory(result.data)
        setHistoryTotal(result.pagination.total)
      } catch (err: any) {
        setError(err.message || 'Impossible de récupérer l\'historique')
      } finally {
        setHistoryLoading(false)
      }
    },
    []
  )

  // ── uploadTryOnImage ──────────────────────────────────────────────────
  const uploadTryOnImage = useCallback(
    async (file: File, declaredType?: TryOnType): Promise<TryOnUploadResult> => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'tryon')
      if (declaredType) formData.append('declaredType', declaredType)

      // Récupérer le token manuellement car apiClient surcharge Content-Type
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers,
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        // 422 = validation échouée (retour structuré du microservice)
        if (response.status === 422) {
          return {
            valid: false,
            errors: result.errors || [],
            warnings: result.warnings || [],
          }
        }
        return {
          valid: false,
          errors: [result.error || 'Upload échoué'],
          warnings: [],
        }
      }

      return {
        valid: result.valid ?? true,
        url: result.url,
        detectedType: result.detectedType,
        confidence: result.confidence,
        typeMismatch: result.typeMismatch,
        warnings: result.warnings || [],
        errors: [],
      }
    },
    []
  )

  // ── Utilitaires ───────────────────────────────────────────────────────
  const clearSession = useCallback(() => {
    stopPolling()
    setSession(null)
    setError(null)
  }, [stopPolling])

  const clearError = useCallback(() => setError(null), [])

  return {
    serviceStatus,
    serviceStatusLoading,
    session,
    sessionLoading,
    history,
    historyLoading,
    historyTotal,
    error,
    checkStatus,
    start,
    deleteSession,
    getHistory,
    uploadTryOnImage,
    clearSession,
    clearError,
  }
}

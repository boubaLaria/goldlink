'use client'

import { useState, useCallback } from 'react'
import apiClient from '@/lib/api-client'

export interface Message {
  id: string
  senderId: string
  receiverId: string
  conversationId: string
  content: string
  images: string[]
  status: 'SENT' | 'READ'
  sender?: any
  createdAt: string
}

export interface UseMessagesReturn {
  messages: Message[]
  loading: boolean
  error: string | null
  list: (conversationId?: string) => Promise<void>
  send: (receiverId: string, content: string, images?: string[]) => Promise<Message>
}

export function useMessages(): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = useCallback(async (conversationId?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params = conversationId ? { conversationId } : {}
      const response = await apiClient.get('/api/messages', { params })
      setMessages(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch messages')
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  const send = useCallback(async (
    receiverId: string,
    content: string,
    images: string[] = []
  ): Promise<Message> => {
    try {
      setLoading(true)
      setError(null)
      const newMessage = await apiClient.post('/api/messages', {
        receiverId,
        content,
        images,
      })
      setMessages((prev) => [...prev, newMessage])
      return newMessage
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    messages,
    loading,
    error,
    list,
    send,
  }
}

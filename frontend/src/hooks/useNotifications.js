import { useState, useEffect, useCallback, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { WS_URL } from '../lib/ws'
import { notificationService } from '../services/api'
import { useAccessToken } from './useAccessToken'

export function useNotifications() {
  const token = useAccessToken()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const clientRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const [notifRes, countRes] = await Promise.all([
        notificationService.getAll(0, 20),
        notificationService.getUnreadCount(),
      ])
      setNotifications(notifRes.data.content || [])
      setUnreadCount(countRes.data.count || 0)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // WebSocket subscription for real-time notifications
  useEffect(() => {
    if (!token) return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 15000,
      heartbeatIncoming: 30000,
      heartbeatOutgoing: 30000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (message) => {
          const notification = JSON.parse(message.body)
          setNotifications((prev) => [notification, ...prev])
          setUnreadCount((prev) => prev + 1)
        })
      },
      onWebSocketError: (event) => {
        console.error('Notification WS error:', event)
      },
      onStompError: (frame) => {
        console.error('Notification STOMP error:', frame.headers['message'])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      if (client.active) {
        client.deactivate()
      }
    }
  }, [token])

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchNotifications()
    }
  }, [fetchNotifications, token])

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }, [])

  const deleteNotification = useCallback(async (id) => {
    try {
      const notif = notifications.find((n) => n.id === id)
      await notificationService.delete(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (notif && !notif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }, [notifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  }
}

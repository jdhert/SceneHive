import { useState, useEffect, useCallback, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { WS_URL } from '../lib/ws'
import { useAccessToken } from './useAccessToken'

export function useWebSocket(workspaceId) {
  const token = useAccessToken()
  const [connected, setConnected] = useState(false)
  const [connectionState, setConnectionState] = useState('idle')
  const [connectionError, setConnectionError] = useState('')
  const [messages, setMessages] = useState([])
  const clientRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)

  useEffect(() => {
    if (!token || !workspaceId) {
      setConnected(false)
      setConnectionState('disabled')
      setConnectionError(!token ? 'missing token' : 'missing workspaceId')
      return
    }

    setConnectionState('connecting')
    setConnectionError('')

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('STOMP:', str)
      },
      reconnectDelay: 15000,
      heartbeatIncoming: 30000,
      heartbeatOutgoing: 30000,
      onConnect: () => {
        console.log('WebSocket connected')
        setConnected(true)
        setConnectionState('connected')
        setConnectionError('')
        reconnectAttemptsRef.current = 0

        client.subscribe(`/topic/workspace/${workspaceId}`, (message) => {
          const newMessage = JSON.parse(message.body)
          setMessages((prev) => [...prev, newMessage])
        })
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected')
        setConnected(false)
        setConnectionState('disconnected')
      },
      onWebSocketClose: (event) => {
        reconnectAttemptsRef.current += 1
        setConnected(false)
        setConnectionState('reconnecting')
        console.warn('WebSocket closed:', event)
      },
      onWebSocketError: (event) => {
        setConnected(false)
        setConnectionState('error')
        setConnectionError('websocket error')
        console.error('WebSocket error:', event)
      },
      onStompError: (frame) => {
        setConnected(false)
        setConnectionState('error')
        setConnectionError(frame.headers['message'] || 'stomp error')
        console.error('STOMP error:', frame.headers['message'])
        console.error('Details:', frame.body)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      if (client.active) {
        client.deactivate()
      }
    }
  }, [workspaceId, token])

  const sendMessage = useCallback(
    (content, type = 'TEXT') => {
      if (clientRef.current?.active) {
        clientRef.current.publish({
          destination: `/app/chat/${workspaceId}`,
          body: JSON.stringify({ content, type }),
        })
      }
    },
    [workspaceId]
  )

  const addMessages = useCallback((newMessages) => {
    setMessages((prev) => [...newMessages, ...prev])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    connected,
    connectionState,
    connectionError,
    messages,
    sendMessage,
    addMessages,
    clearMessages,
  }
}

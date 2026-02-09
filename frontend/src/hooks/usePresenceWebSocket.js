import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { WS_URL } from '../lib/ws'
import { useUser } from '../contexts/UserContext'

export function usePresenceWebSocket() {
  const clientRef = useRef(null)
  const { fetchUser } = useUser()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
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
        setTimeout(() => {
          fetchUser()
        }, 300)
      },
      onWebSocketError: (event) => {
        console.error('Presence WS socket error:', event)
      },
      onWebSocketClose: (event) => {
        console.warn('Presence WS closed:', event)
      },
      onStompError: (frame) => {
        console.error('Presence WS error:', frame.headers['message'])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      if (client.active) {
        client.deactivate()
      }
    }
  }, [])
}

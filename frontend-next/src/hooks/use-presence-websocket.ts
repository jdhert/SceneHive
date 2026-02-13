'use client';

import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { WS_URL } from '@/lib/ws';
import { useUser } from '@/providers/user-provider';
import { useAccessToken } from './use-access-token';

export function usePresenceWebSocket() {
  const clientRef = useRef<Client | null>(null);
  const { fetchUser } = useUser();
  const token = useAccessToken();

  useEffect(() => {
    if (!token) return;

    let client: Client;

    const initClient = async () => {
      const SockJS = (await import('sockjs-client')).default;

      client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          'X-Presence': 'true',
        },
        reconnectDelay: 15000,
        heartbeatIncoming: 30000,
        heartbeatOutgoing: 30000,
        onConnect: () => {
          setTimeout(() => {
            fetchUser();
          }, 300);
        },
        onWebSocketError: (event) => {
          console.error('Presence WS socket error:', event);
        },
        onWebSocketClose: (event) => {
          console.warn('Presence WS closed:', event);
        },
        onStompError: (frame) => {
          console.error('Presence WS error:', frame.headers['message']);
        },
      });

      client.activate();
      clientRef.current = client;
    };

    initClient();

    return () => {
      if (client?.active) {
        client.deactivate();
      }
    };
  }, [token, fetchUser]);
}

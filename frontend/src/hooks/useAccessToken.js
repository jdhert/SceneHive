import { useEffect, useState } from 'react'
import { getAccessToken, subscribeAccessToken } from '../lib/accessToken'

export function useAccessToken() {
  const [token, setToken] = useState(getAccessToken())

  useEffect(() => {
    const unsubscribe = subscribeAccessToken(setToken)
    return () => unsubscribe()
  }, [])

  return token
}

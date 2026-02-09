import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { userService } from '../services/api'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const autoOnlineRef = useRef(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      const response = await userService.getMe()
      setUser(response.data)
      localStorage.setItem('user', JSON.stringify(response.data))
    } catch (err) {
      console.error('Failed to fetch user:', err)
      setUser(null)
      localStorage.removeItem('user')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user || autoOnlineRef.current) return
    if (user.status !== 'OFFLINE') return

    autoOnlineRef.current = true
    userService.updateStatus('ONLINE')
      .then((response) => {
        updateUser(response.data)
      })
      .catch(() => {
        autoOnlineRef.current = false
      })
  }, [user?.id, user?.status])

  useEffect(() => {
    const handleUnload = () => {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'
      const base = apiUrl.replace(/\/$/, '')

      try {
        fetch(`${base}/users/me/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'OFFLINE' }),
          keepalive: true,
        })
      } catch (e) {
        // ignore unload failures
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }))
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      localStorage.setItem('user', JSON.stringify({ ...parsed, ...updatedData }))
    }
  }

  const logout = async () => {
    try {
      await userService.updateStatus('OFFLINE')
    } catch (err) {
      // ignore logout status failures
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setUser(null)
      window.location.href = '/login'
    }
  }

  return (
    <UserContext.Provider value={{ user, isLoading, fetchUser, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export default UserContext

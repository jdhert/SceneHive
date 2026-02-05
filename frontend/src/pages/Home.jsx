import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Sample aircraft data
const sampleAircraftData = [
  { id: 1, model: 'Boeing 737-800', registration: 'HL8012', airline: 'Korean Air', status: 'In Flight', destination: 'Tokyo (NRT)' },
  { id: 2, model: 'Airbus A350-900', registration: 'HL7578', airline: 'Asiana Airlines', status: 'Landed', destination: 'Los Angeles (LAX)' },
  { id: 3, model: 'Boeing 777-300ER', registration: 'HL8208', airline: 'Korean Air', status: 'In Flight', destination: 'New York (JFK)' },
  { id: 4, model: 'Airbus A321neo', registration: 'HL8366', airline: 'Jin Air', status: 'Boarding', destination: 'Osaka (KIX)' },
  { id: 5, model: 'Boeing 787-9', registration: 'HL8082', airline: 'Korean Air', status: 'Scheduled', destination: 'Paris (CDG)' },
  { id: 6, model: 'Airbus A330-300', registration: 'HL7792', airline: 'Asiana Airlines', status: 'In Flight', destination: 'Bangkok (BKK)' },
]

function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aircraftData] = useState(sampleAircraftData)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await authService.getMe()
      setUser(response.data)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      // 비로그인 상태로 유지 (리다이렉트 하지 않음)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Flight': return 'bg-green-500'
      case 'Landed': return 'bg-blue-500'
      case 'Boarding': return 'bg-yellow-500'
      case 'Scheduled': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      {/* Header */}
      <header className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Aircraft Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-white/70 text-sm">Welcome, {user.name}</span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-white">{aircraftData.length}</div>
              <div className="text-white/60 text-sm">Total Aircraft</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-400">{aircraftData.filter(a => a.status === 'In Flight').length}</div>
              <div className="text-white/60 text-sm">In Flight</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-400">{aircraftData.filter(a => a.status === 'Landed').length}</div>
              <div className="text-white/60 text-sm">Landed</div>
            </CardContent>
          </Card>
          <Card style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-400">{aircraftData.filter(a => a.status === 'Boarding').length}</div>
              <div className="text-white/60 text-sm">Boarding</div>
            </CardContent>
          </Card>
        </div>

        {/* Aircraft Table */}
        <Card style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Aircraft Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Model</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Registration</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Airline</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Destination</th>
                  </tr>
                </thead>
                <tbody>
                  {aircraftData.map((aircraft) => (
                    <tr key={aircraft.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white">{aircraft.model}</td>
                      <td className="py-3 px-4 text-white font-mono">{aircraft.registration}</td>
                      <td className="py-3 px-4 text-white">{aircraft.airline}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(aircraft.status)}`}>
                          {aircraft.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/80">{aircraft.destination}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default Home

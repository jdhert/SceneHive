const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'
const API_BASE = API_URL.replace(/\/api\/?$/, '')

export const WS_URL = `${API_BASE}/ws`

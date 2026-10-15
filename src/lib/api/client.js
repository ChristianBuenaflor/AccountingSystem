import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: API_BASE, headers: { Accept: 'application/json' } })

// Laravel validation errors -> one readable string
export const errorMessage = (e) => {
  const d = e.response?.data
  if (d?.errors) return Object.values(d.errors).flat().join(' ')
  return d?.message || e.message
}

export default api

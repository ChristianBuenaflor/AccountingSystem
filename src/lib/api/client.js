import axios from 'axios'
import { getSession, logout } from '../store/auth.js'

// alphalist-api (Laravel + Sanctum). Vite proxies /api to it in dev; set VITE_API_URL to point elsewhere.
export const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: API_BASE, headers: { Accept: 'application/json' } })

// Every request carries the token from POST /api/login.
api.interceptors.request.use((config) => {
  const token = getSession()?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Token expired or revoked: back to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getSession()) {
      logout()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export const API_DOWN_MESSAGE =
  'Cannot reach the Alphalist API (http://127.0.0.1:8791). Start it with "Start Alphalist API.bat" in the alphalist-api folder, then try again.'

// No answer from Laravel: the request failed outright, or the Vite proxy answered 5xx with no JSON body.
export const isApiDown = (e) =>
  !e.response || (e.response.status >= 500 && (e.response.data == null || typeof e.response.data !== 'object'))

// API errors -> one readable string ({ isSuccess: false, message, errors })
export const errorMessage = (e) => {
  if (isApiDown(e)) return API_DOWN_MESSAGE
  const d = e.response?.data
  if (d?.errors) return Object.values(d.errors).flat().join(' ')
  return d?.message || e.message
}

// Download a file from an authenticated endpoint (a plain <a href> cannot send the token).
export async function downloadFile(url, params, fallbackName = 'download') {
  const res = await api.get(url, { params, responseType: 'blob' })
  const disposition = res.headers['content-disposition'] || ''
  const name = res.headers['x-dat-filename'] || /filename="?([^";]+)"?/.exec(disposition)?.[1] || fallbackName
  const href = URL.createObjectURL(res.data)
  const a = Object.assign(document.createElement('a'), { href, download: name })
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(href)
}

export default api

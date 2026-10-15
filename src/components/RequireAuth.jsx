import { Navigate } from 'react-router-dom'
import { getSession } from '../lib/store/auth.js'

export default function RequireAuth({ children }) {
  return getSession() ? children : <Navigate to="/login" replace />
}

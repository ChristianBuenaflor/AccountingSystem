import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Form, Button, Alert } from 'react-bootstrap'
import { ArrowRight } from 'lucide-react'
import { getSession, login } from '../../lib/store/auth.js'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (getSession()) return <Navigate to="/dashboard" replace />

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.includes('@') || password.length < 4) {
      setError('Enter a valid email and a password of 4+ characters (demo mode).')
      return
    }
    login(email)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="d-flex align-items-center justify-content-center px-3" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a2332 0%, #1e3a5f 50%, #2c5282 100%)' }}>
      <div className="row g-0 overflow-hidden w-100" style={{ maxWidth: 880, borderRadius: 20, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
        <div className="col-md-5 d-none d-md-flex flex-column justify-content-center p-5 text-white" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="sidebar-brand-icon">FP</div>
            <span className="fw-bold fs-5">FinancePro</span>
          </div>
          <h3 className="fw-bold mb-3">Welcome back</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Sign in to access your dashboards, invoices, and reports.</p>
          <Link to="/" className="text-decoration-none mt-3" style={{ color: '#00b894', fontSize: '0.85rem' }}>← Back to home</Link>
        </div>
        <div className="col-md-7 bg-white p-5">
          <h4 className="fw-bold mb-1">Sign in</h4>
          <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Demo mode — use any email, no real account needed.</p>
          {error && <Alert variant="danger" style={{ fontSize: '0.85rem' }}>{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="text" inputMode="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </Form.Group>
            <Button type="submit" className="btn-accent w-100 d-flex align-items-center justify-content-center gap-2">
              Sign In <ArrowRight size={16} />
            </Button>
          </Form>
          <div className="text-center mt-4" style={{ fontSize: '0.8rem' }}>
            <span className="text-muted">New to FinancePro? </span>
            <Link to="/" style={{ color: '#00b894', textDecoration: 'none', fontWeight: 600 }}>See what it does</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

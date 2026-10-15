import { useNavigate } from 'react-router-dom'
import { Search, Bell, Person, BoxArrowRight } from 'react-bootstrap-icons'
import { Badge, Button } from 'react-bootstrap'
import { getSession, logout } from '../lib/store/auth.js'

export default function Topbar() {
  const navigate = useNavigate()
  const session = getSession()
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <header className="fp-topbar">
      <label className="fp-search"><Search /><input placeholder="Search..." /></label>
      <div className="d-flex align-items-center gap-3">
        <span className="fp-bell"><Bell size={18} /><Badge bg="danger" pill>3</Badge></span>
        <span className="fp-avatar"><Person size={16} /></span>
        <strong style={{ fontSize: '.85rem' }}>{session?.email || 'Admin User'}</strong>
        <Button variant="link" size="sm" className="text-muted p-0 d-flex align-items-center gap-1" title="Log out" onClick={handleLogout}>
          <BoxArrowRight size={16} />
        </Button>
      </div>
    </header>
  )
}

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Person, BoxArrowRight, List } from 'react-bootstrap-icons'
import { Badge, Button } from 'react-bootstrap'
import { getSession } from '../lib/store/auth.js'
import { authApi } from '../lib/api/alphalist.js'
import { AgentMismatchBar, AgentSwitcher, resetAgents } from './AgentPicker'

// Pages with "Send to Alphalist": they warn when the company shown is not the one Alphalist is registered to.
const SENDS = /^\/alphalist\/(qap|1604[cef]|map|sawt|1621)\b/

export default function Topbar() {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const session = getSession()
  const handleLogout = async () => {
    await authApi.logout()
    resetAgents()
    navigate('/login', { replace: true })
  }

  // Narrow screens: the sidebar slides in over the page (see .fp-nav-open in index.css).
  const [navOpen, setNavOpen] = useState(false)
  useEffect(() => { document.body.classList.toggle('fp-nav-open', navOpen) }, [navOpen])
  useEffect(() => { setNavOpen(false) }, [pathname, search])
  useEffect(() => () => document.body.classList.remove('fp-nav-open'), [])

  return (
    <div className="fp-topbar-wrap">
      <header className="fp-topbar">
        <div className="d-flex align-items-center gap-3 flex-grow-1 min-w-0">
          <Button variant="light" size="sm" className="fp-nav-toggle" aria-label="Menu" aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}><List size={20} /></Button>
          <label className="fp-search"><Search aria-hidden /><input placeholder="Search..." aria-label="Search" /></label>
          <AgentSwitcher />
        </div>
        <div className="d-flex align-items-center gap-3 flex-shrink-0">
          <span className="fp-bell d-none d-md-inline"><Bell size={18} /><Badge bg="danger" pill>3</Badge></span>
          <span className="fp-avatar d-none d-md-grid"><Person size={16} /></span>
          <strong className="d-none d-lg-inline" style={{ fontSize: '.85rem' }}>{session?.name || session?.email || 'Admin User'}</strong>
          <Button variant="link" size="sm" className="text-muted p-0 d-flex align-items-center gap-1" title="Log out" aria-label="Log out" onClick={handleLogout}>
            <BoxArrowRight size={16} />
          </Button>
        </div>
      </header>
      {SENDS.test(pathname) && <AgentMismatchBar />}
      {navOpen && <div className="fp-nav-backdrop" onClick={() => setNavOpen(false)} aria-hidden />}
    </div>
  )
}

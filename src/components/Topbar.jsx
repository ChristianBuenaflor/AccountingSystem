import { Search, Bell, Person } from 'react-bootstrap-icons'
import { Badge } from 'react-bootstrap'

export default function Topbar() {
  return (
    <header className="fp-topbar">
      <label className="fp-search"><Search /><input placeholder="Search..." /></label>
      <div className="d-flex align-items-center gap-3">
        <span className="fp-bell"><Bell size={18} /><Badge bg="danger" pill>3</Badge></span>
        <span className="fp-avatar"><Person size={16} /></span>
        <strong style={{ fontSize: '.85rem' }}>Admin User</strong>
      </div>
    </header>
  )
}

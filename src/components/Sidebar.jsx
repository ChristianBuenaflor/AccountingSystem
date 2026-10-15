import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'react-bootstrap-icons'
import { NAV } from '../config/nav'

function Group({ item }) {
  const { pathname } = useLocation()
  const active = item.children.some((c) => pathname.startsWith(c.path))
  const [open, setOpen] = useState(active)
  const Icon = item.icon
  return (
    <>
      <button className="fp-item" onClick={() => setOpen(!open)}>
        <Icon size={18} /> {item.label}
        <span className="fp-chev">{open ? <ChevronDown /> : <ChevronRight />}</span>
      </button>
      {open && (
        <div className={`fp-children ${active ? 'is-active' : ''}`}>
          {item.children.map((c) => (
            <NavLink key={c.path} to={c.path} className="fp-child">
              <c.icon size={16} /> {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </>
  )
}

export default function Sidebar() {
  return (
    <aside className="fp-sidebar">
      <div className="fp-brand"><span className="fp-logo">FP</span> FinancePro</div>
      {NAV.map((s) => (
        <div key={s.section}>
          <div className="fp-section">{s.section}</div>
          {s.items.map((i) =>
            i.children ? <Group key={i.key} item={i} /> : (
              <NavLink key={i.path} to={i.path} className="fp-item">
                <i.icon size={18} /> {i.label}
              </NavLink>
            )
          )}
        </div>
      ))}
    </aside>
  )
}

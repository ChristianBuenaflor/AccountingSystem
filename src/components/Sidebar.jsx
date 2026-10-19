import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'react-bootstrap-icons'
import { NAV } from '../config/nav'

// Every link in the menu, groups flattened.
const LINKS = NAV.flatMap((s) => s.items.flatMap((i) => (i.children ? i.children : [i])))

/**
 * The one menu item for the current address. Some pages are reachable from two places
 * (QAP: Purchases > "Tax Withheld from Suppliers" opens /alphalist/qap?form=1601EQ, ALPHALIST > QAP Entry
 * opens /alphalist/qap), so the best match wins: a link whose query matches the address beats the plain
 * path, a longer path beats a shorter one, and only that item is highlighted.
 */
function activePath(pathname, search) {
  const here = new URLSearchParams(search)
  let best = null
  let bestScore = -1
  for (const { path } of LINKS) {
    const [base, query = ''] = path.split('?')
    if (pathname !== base && !pathname.startsWith(base + '/')) continue
    const wanted = [...new URLSearchParams(query)]
    if (wanted.some(([k, v]) => here.get(k) !== v)) continue
    const score = wanted.length * 1000 + base.length
    if (score > bestScore) { best = path; bestScore = score }
  }
  return best
}

function Group({ item, current }) {
  const active = item.children.some((c) => c.path === current)
  const [open, setOpen] = useState(active)
  // Arriving at one of its pages (from a link elsewhere) opens the group.
  useEffect(() => { if (active) setOpen(true) }, [active])
  const Icon = item.icon
  return (
    <>
      <button type="button" className={`fp-item ${active ? 'has-active' : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon size={18} /> {item.label}
        <span className="fp-chev">{open ? <ChevronDown /> : <ChevronRight />}</span>
      </button>
      {open && (
        <div className="fp-children">
          {item.children.map((c) => (
            <Link key={c.path} to={c.path} className={`fp-child ${c.path === current ? 'active' : ''}`} aria-current={c.path === current ? 'page' : undefined}>
              <c.icon size={16} /> {c.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

export default function Sidebar() {
  const { pathname, search } = useLocation()
  const current = activePath(pathname, search)
  return (
    <aside className="fp-sidebar">
      <div className="fp-brand"><span className="fp-logo">FP</span> FinancePro</div>
      {NAV.map((s) => (
        <div key={s.section}>
          <div className="fp-section">{s.section}</div>
          {s.items.map((i) =>
            i.children ? <Group key={i.key} item={i} current={current} /> : (
              <Link key={i.path} to={i.path} className={`fp-item ${i.path === current ? 'active' : ''}`} aria-current={i.path === current ? 'page' : undefined}>
                <i.icon size={18} /> {i.label}
              </Link>
            )
          )}
        </div>
      ))}
    </aside>
  )
}

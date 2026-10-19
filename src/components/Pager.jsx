import { useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons'

// "51–100 of 15,000 bills" with Previous / Next, under a list that is paged on the server.
export default function Pager({ pagination, onPage, noun = 'records' }) {
  if (!pagination || !pagination.total) return null
  const { current_page: page, last_page: last, per_page: per, total } = pagination
  const from = (page - 1) * per + 1
  const to = Math.min(page * per, total)
  return (
    <div className="fp-pager">
      <span className="text-muted small">{from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()} {noun}</span>
      {last > 1 && (
        <div className="d-flex align-items-center gap-2">
          <Button size="sm" variant="light" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft aria-hidden /> Prev</Button>
          <span className="small text-nowrap">Page {page} of {last.toLocaleString()}</span>
          <Button size="sm" variant="light" disabled={page >= last} onClick={() => onPage(page + 1)} aria-label="Next page">Next <ChevronRight aria-hidden /></Button>
        </div>
      )}
    </div>
  )
}

// A search box that waits until typing pauses before searching (the server does the searching).
export function SearchBox({ value, onSearch, placeholder = 'Search', label = 'Search', delay = 300, style }) {
  const [text, setText] = useState(value ?? '')
  useEffect(() => { setText(value ?? '') }, [value])
  useEffect(() => {
    if (text === (value ?? '')) return undefined
    const t = setTimeout(() => onSearch(text.trim()), delay)
    return () => clearTimeout(t)
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps
  return <Form.Control type="search" placeholder={placeholder} aria-label={label} style={{ width: 240, maxWidth: '100%', ...style }} value={text} onChange={(e) => setText(e.target.value)} />
}

import { useEffect, useRef, useState } from 'react'
import { Form, ListGroup, Spinner } from 'react-bootstrap'

// Pick a supplier / customer by typing part of the name or TIN. The server does the searching,
// so this works with any number of them (a plain dropdown only ever had the first 500).
//   <PartnerPicker api={suppliersApi} value={partner} onChange={setPartner} />   partner: { id, name, formatted_tin } | null
export default function PartnerPicker({ id, api, value, onChange, required, noun = 'supplier' }) {
  const [text, setText] = useState(value?.name ?? '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const seq = useRef(0)

  useEffect(() => { setText(value?.name ?? '') }, [value?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Search as the user types (after a short pause); an empty box lists the first ones alphabetically.
  useEffect(() => {
    if (!open) return undefined
    const t = setTimeout(() => {
      const n = ++seq.current
      setLoading(true)
      api.page({ search: value && text === value.name ? '' : text.trim(), per_page: 20 })
        .then(({ rows }) => { if (n === seq.current) setResults(rows) })
        .catch(() => { if (n === seq.current) setResults([]) })
        .finally(() => { if (n === seq.current) setLoading(false) })
    }, 250)
    return () => clearTimeout(t)
  }, [text, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (p) => { onChange(p); setText(p.name); setOpen(false) }

  return (
    <div className="fp-picker">
      <Form.Control id={id} autoComplete="off" required={required} placeholder={`Type a ${noun} name or TIN`} value={text} role="combobox"
        aria-expanded={open} aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => { setOpen(false); if (value && text !== value.name) setText(value.name) }, 150)}
        onChange={(e) => { setText(e.target.value); setOpen(true); if (value) onChange(null) }}
        onKeyDown={(e) => { if (e.key === 'Enter' && open && results[0]) { e.preventDefault(); choose(results[0]) } if (e.key === 'Escape') setOpen(false) }} />
      {open && (
        <ListGroup className="fp-picker-list" role="listbox">
          {loading && results.length === 0 && <ListGroup.Item className="text-muted small"><Spinner size="sm" aria-hidden /> Searching…</ListGroup.Item>}
          {!loading && results.length === 0 && <ListGroup.Item className="text-muted small">No {noun} matches "{text}".</ListGroup.Item>}
          {results.map((p) => (
            <ListGroup.Item key={p.id} action role="option" aria-selected={value?.id === p.id} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(p)}>
              <div className="fw-semibold">{p.name}</div>
              <div className="small text-muted">{p.formatted_tin || 'no TIN'}</div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  )
}

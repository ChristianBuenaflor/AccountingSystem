import { Alert, Button, Placeholder, Spinner } from 'react-bootstrap'

// Grey placeholder rows in a table body while its data loads. hide: indexes of the columns that are
// .fp-hide-narrow in the header, so the placeholders line up on narrow screens too.
export function SkeletonRows({ cols, rows = 3, hide = [] }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r} aria-hidden>
      {Array.from({ length: cols }, (_, c) => (
        <td key={c} className={hide.includes(c) ? 'fp-hide-narrow' : undefined}><Placeholder as="span" animation="glow"><Placeholder xs={c === 2 ? 10 : 6} className="rounded" /></Placeholder></td>
      ))}
    </tr>
  ))
}

// "Loading…" with a spinner, for blocks that are not tables. Screen readers hear it once.
export function Loading({ text = 'Loading…', className = '' }) {
  return <div className={`fp-sub d-flex align-items-center gap-2 ${className}`} role="status"><Spinner size="sm" aria-hidden /> {text}</div>
}

// A failed load, with a way to try again.
export function LoadError({ error, onRetry }) {
  if (!error) return null
  return (
    <Alert variant="danger" className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
      <span>{error}</span>
      {onRetry && <Button size="sm" variant="outline-danger" onClick={onRetry}>Try again</Button>}
    </Alert>
  )
}

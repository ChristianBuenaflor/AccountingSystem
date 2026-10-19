import { useMemo } from 'react'
import { Badge, Spinner } from 'react-bootstrap'
import { filingApi } from '../lib/api/alphalist'
import { money } from '../lib/money'
import useLoad from '../lib/useLoad'

// Which forms and periods of a year already have lines, from GET /api/filing-status,
// so a page can say so up front instead of making you open every form and month.
//   const stats = usePeriodStats(agentId, year)
//   stats.count('2550M')            -> lines in the year
//   stats.count('2550M', 9)         -> lines in September (month for monthly forms, quarter number for QAP)
//   stats.periods(['2550M', ...])   -> [{ code, label, period, lines, tax_withheld, status, pick: { form, month? | quarter? } }], newest first
export function usePeriodStats(agentId, year) {
  const load = useLoad(() => agentId && year && filingApi.get(agentId, year), [agentId, year], { keep: true })

  return useMemo(() => {
    const returns = load.data?.returns ?? []
    const byCode = Object.fromEntries(returns.map((r) => [r.code, r]))
    const slot = (p, r) => (r.cadence === 'quarterly' ? p.quarter : p.month)
    return {
      loading: load.loading,
      ready: !!load.data,
      reload: load.reload,
      count: (code, at) => {
        const r = byCode[code]
        if (!r) return 0
        return r.periods.filter((p) => at == null || slot(p, r) === at).reduce((n, p) => n + p.lines, 0)
      },
      periods: (codes) => codes
        .flatMap((code) => (byCode[code]?.periods ?? []).filter((p) => p.lines > 0).map((p) => ({
          code,
          label: byCode[code].label,
          period: p.label,
          return_period: p.return_period,
          lines: p.lines,
          tax_withheld: p.tax_withheld,
          status: p.status,
          sent: !!p.last_sent,
          pick: { form: code, ...(byCode[code].cadence === 'quarterly' ? { quarter: p.quarter } : { month: p.month }) },
        })))
        .sort((a, b) => b.return_period.localeCompare(a.return_period) || codes.indexOf(a.code) - codes.indexOf(b.code)),
    }
  }, [load.data, load.loading, load.reload])
}

const STATUS = {
  sent: ['success', 'Sent'],
  changed: ['warning', 'Changed since send'],
  overdue: ['danger', 'Overdue'],
  has_lines: ['secondary', 'Not sent'],
}

// "Periods with lines in 2026": one chip per form + period that has lines; a click opens it.
export default function PeriodsWithLines({ stats, codes, year, isCurrent, onPick, label = (p) => `${p.label} · ${p.period}` }) {
  const items = stats.periods(codes)
  return (
    <div className="fp-periods mb-3" aria-label={`Periods with lines in ${year}`}>
      <span className="fp-periods-title">With lines in {year}:</span>
      {!stats.ready && stats.loading && <Spinner size="sm" className="text-muted" aria-label="Loading" />}
      {stats.ready && items.length === 0 && <span className="text-muted small">none yet</span>}
      {items.map((p) => {
        const [variant, text] = STATUS[p.status] ?? STATUS.has_lines
        const current = isCurrent(p.pick)
        return (
          <button key={`${p.code}-${p.return_period}`} type="button" className={`fp-period-chip ${current ? 'is-current' : ''}`}
            aria-pressed={current} onClick={() => onPick(p.pick)} title={`${p.lines} line(s), tax withheld ₱${money(p.tax_withheld)}`}>
            <strong>{label(p)}</strong>
            <span className="text-muted">{p.lines} line{p.lines === 1 ? '' : 's'} · ₱{money(p.tax_withheld)}</span>
            <Badge bg={variant} text={variant === 'warning' ? 'dark' : undefined}>{text}</Badge>
          </button>
        )
      })}
    </div>
  )
}

import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Button, ButtonGroup, Card } from 'react-bootstrap'
import { ArrowClockwise, ArrowRepeat, CheckCircleFill, ChevronLeft, ChevronRight, ExclamationTriangleFill, PencilSquare } from 'react-bootstrap-icons'
import { filingApi } from '../../lib/api/alphalist'
import { agentName, useAgents } from '../../components/AgentPicker'
import { Loading, LoadError } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import useLoad from '../../lib/useLoad'
import { money } from '../../lib/money'
import './FilingStatusPage.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// GET /api/filing-status statuses, worst first
const STATUS = {
  overdue: { label: 'Overdue', legend: 'Overdue, not sent', Icon: ExclamationTriangleFill },
  changed: { label: 'Changed', legend: 'Changed since send', Icon: ArrowRepeat },
  has_lines: { label: 'Not sent', legend: 'Has lines, not sent', Icon: PencilSquare },
  sent: { label: 'Sent', legend: 'Sent to Alphalist', Icon: CheckCircleFill },
  empty: { label: '', legend: 'Nothing keyed', Icon: null },
}

const GROUPS = [
  ['QAP', 'Quarterly alphalist of payees (QAP) and 1621'],
  ['MAP', 'Monthly alphalist of payees (MAP)'],
  ['SAWT', 'Taxes withheld from you (SAWT)'],
  ['ANNUAL', 'Annual information returns'],
]

// The screen that holds a return's lines; it reads ?agent=&form=&year=&quarter|month=
const SCREENS = { '1601EQ': '/alphalist/qap', '1601FQ': '/alphalist/qap', 1621: '/alphalist/1621', '1604C': '/alphalist/1604c', '1604E': '/alphalist/1604e', '1604F': '/alphalist/1604f', MAP: '/alphalist/map', SAWT: '/alphalist/sawt' }
const href = (ret, period, agentId) => `${SCREENS[ret.code] ?? SCREENS[ret.group]}?${new URLSearchParams({ agent: agentId, ...period.link })}`

const SPAN = { monthly: 1, quarterly: 3, quarters3: 3, annual: 12 }

const day = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
const shortDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
const when = (iso) => new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
const lines = (n) => `${n} line${n === 1 ? '' : 's'}`
const periodName = (ret, p) => (ret.cadence === 'annual' && p.expected ? String(p.return_period.slice(0, 4)) : `${p.label} ${p.return_period.slice(0, 4)}`)

// Everything about one cell, for its tooltip and screen readers.
function describe(ret, p) {
  const due = {
    overdue: `Was due ${day(p.due_date)} (${-p.days_until_due} days ago).`,
    has_lines: `Due ${day(p.due_date)} (in ${p.days_until_due} days).`,
  }[p.status] ?? `Due ${day(p.due_date)}.`
  return [
    `${ret.label} ${periodName(ret, p)}: ${STATUS[p.status].legend}.`,
    p.lines > 0 ? `${lines(p.lines)}, tax withheld ₱${money(p.tax_withheld)}.` : 'No lines.',
    due,
    p.last_sent ? `Last sent ${when(p.last_sent.sent_at)} (${lines(p.last_sent.rows_added)}).` : null,
    p.changed_since_send ? 'Lines changed after that send: send it again.' : null,
    'Open to see the lines.',
  ].filter(Boolean).join(' ')
}

function Chip({ ret, period: p, agentId, wide }) {
  const { label, Icon } = STATUS[p.status]
  const soon = p.status === 'has_lines' && p.days_until_due <= 7
  const text = describe(ret, p)
  let meta = p.lines > 0 ? lines(p.lines) : '—'
  // the annual returns (and Q4) fall due the next year: say so
  if (wide && p.status !== 'sent' && p.status !== 'empty') meta += ` · due ${p.due_date.slice(0, 4) === p.return_period.slice(0, 4) ? shortDay(p.due_date) : day(p.due_date)}`
  return (
    <Link to={href(ret, p, agentId)} className={`fs-chip fs-${p.status}`} title={text} aria-label={text}>
      {wide && <span className="fs-period">{periodName(ret, p)}</span>}
      {Icon && <span className="fs-status"><Icon size={10} aria-hidden /> {label}</span>}
      <span className={`fs-meta${soon ? ' fs-soon' : ''}`}>{soon && !wide ? `due in ${p.days_until_due}d` : meta}</span>
      {soon && wide && <span className="fs-meta fs-soon">due in {p.days_until_due} day{p.days_until_due === 1 ? '' : 's'}</span>}
    </Link>
  )
}

function ReturnRow({ ret, agentId }) {
  const span = SPAN[ret.cadence]
  return (
    <tr>
      <th scope="row" className="fs-return">
        <div className="fs-return-label">{ret.label}</div>
        <div className="fs-return-title" title={ret.title}>{ret.built_from ? `Built from the year's ${ret.built_from.replace(/^1601/, '1601-')} lines` : ret.title}</div>
      </th>
      {ret.periods.filter((p) => p.expected).map((p) => (
        <td key={p.key} colSpan={span}><Chip ret={ret} period={p} agentId={agentId} wide={span > 1} /></td>
      ))}
      {ret.cadence === 'quarters3' && (
        <td colSpan={3}><div className="fs-none" title={`No fourth-quarter ${ret.label.replace('SAWT ', '')}: the annual return covers it.`}>No Q4 return</div></td>
      )}
    </tr>
  )
}

// One page for what is keyed, sent to BIR Alphalist, changed since, or due: every return x period of a year.
export default function FilingStatusPage() {
  const { agents, id: agentId } = useAgents()
  const agent = agents.find((a) => String(a.id) === String(agentId))
  const [search] = useSearchParams()
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(() => Number(search.get('year')) || thisYear)
  const { data, loading, error, reload } = useLoad(() => agentId && filingApi.get(agentId, year), [agentId, year])

  const stray = data ? data.returns.flatMap((ret) => ret.periods.filter((p) => !p.expected).map((p) => ({ ret, p }))) : []
  const nowMonth = year === thisYear ? new Date().getMonth() : -1

  return (
    <>
      <PageHeader title="BIR Filing Status" sub={agent ? `What is keyed, sent to BIR Alphalist, changed since, or due for ${agentName(agent)}.` : 'What is keyed, sent to BIR Alphalist, changed since, or due.'}>
        <ButtonGroup aria-label="Year">
          <Button variant="light" onClick={() => setYear((y) => y - 1)} aria-label="Previous year"><ChevronLeft aria-hidden /></Button>
          <Button variant="light" disabled className="fw-semibold text-dark" style={{ minWidth: 72, opacity: 1 }}>{year}</Button>
          <Button variant="light" onClick={() => setYear((y) => y + 1)} aria-label="Next year"><ChevronRight aria-hidden /></Button>
        </ButtonGroup>
        <Button variant="light" onClick={reload} disabled={!agentId || loading} aria-label="Refresh"><ArrowClockwise aria-hidden /> Refresh</Button>
      </PageHeader>

      {!agentId && agents.length === 0 && !loading && (
        <Alert variant="info">Add a withholding agent first: <Link to="/alphalist/agents">Withholding Agents</Link>.</Alert>
      )}
      <LoadError error={error} onRetry={reload} />
      {loading && !data && <Loading text="Checking every return…" className="mb-3" />}

      {data && (
        <>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div className="fs-legend" aria-label="Status counts">
              {Object.entries(STATUS).map(([key, s]) => (
                <span key={key} className={`fs-chip fs-${key}`}>
                  {s.Icon && <s.Icon size={11} aria-hidden />}
                  <span>{s.legend}</span>
                  <span className="fs-count">{data.summary[key]}</span>
                </span>
              ))}
            </div>
            <div className="fp-sub small">As of {day(data.as_of)} · click a cell to open its lines</div>
          </div>

          {stray.length > 0 && (
            <Alert variant="warning">
              <div className="mb-2">These lines are keyed in a month their return is not filed for, so they are not part of its quarter or year. Open them to move them to the return period:</div>
              <div className="d-flex flex-wrap gap-2">
                {stray.map(({ ret, p }) => (
                  <Link key={`${ret.code}-${p.key}`} to={href(ret, p, agentId)} className="btn btn-sm btn-outline-dark">{ret.label} · {p.label} {year} ({lines(p.lines)})</Link>
                ))}
              </div>
            </Alert>
          )}

          <div className={`fp-card mb-3 ${loading ? 'fp-table-loading' : ''}`}>
            <div className="table-responsive">
              <table className="table fs-grid">
                <caption className="visually-hidden">Filing status of every BIR return for {year}, by month</caption>
                <thead>
                  <tr>
                    <th scope="col" className="fs-return text-start">Return</th>
                    {MONTHS.map((m, i) => <th key={m} scope="col" className={i === nowMonth ? 'fs-now' : undefined}>{m}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {GROUPS.map(([group, title]) => {
                    const rows = data.returns.filter((r) => r.group === group)
                    if (rows.length === 0) return null
                    return [
                      <tr key={group} className="fs-group"><td colSpan={13}><span className="fs-group-title">{title}</span></td></tr>,
                      ...rows.map((ret) => <ReturnRow key={ret.code} ret={ret} agentId={agentId} />),
                    ]
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h2 className="h6 mb-1">Due dates used</h2>
              <p className="fp-sub small mb-3">
                Confirm these against current BIR issuances (revenue regulations, RMCs, the BIR tax calendar): the BIR moves deadlines by circular.
                A deadline on a weekend or holiday moves to the next working day, which is not applied here.
              </p>
              <dl className="row fs-rules mb-0">
                {data.returns.map((ret) => (
                  <div key={ret.code} className="col-md-6 d-flex gap-2 mb-1">
                    <dt className="text-nowrap" style={{ minWidth: 92 }}>{ret.label}</dt>
                    <dd className="mb-0">{ret.due_rule}</dd>
                  </div>
                ))}
              </dl>
            </Card.Body>
          </Card>
        </>
      )}
    </>
  )
}

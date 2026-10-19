import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Badge, Button, Card, Form, Placeholder, Spinner, Table } from 'react-bootstrap'
import { annualApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import { agentName, useAgents } from '../../components/AgentPicker'
import AnalysisView from '../../components/AnalysisView'
import BirValidation from '../../components/BirValidation'
import { LoadError, SkeletonRows } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import { usePeriodStats } from '../../components/PeriodsWithLines'
import SendDialog from '../../components/SendDialog'
import { money } from '../../lib/money'
import useLoad from '../../lib/useLoad'

const FORMS = {
  '1604F': { title: '1604-F Annual Return', sub: "Built from the year's 1601-FQ lines (Sch. 1 → 4, Sch. 2 → 5, Sch. 3 → 6).", from: '1601-FQ' },
  '1604E': { title: '1604-E Annual Return', sub: "Built from the year's 1601-EQ lines (Sch. 1 → 3, Sch. 2 → 4).", from: '1601-EQ' },
}

// One screen for both annual returns: <Annual1604FPage form="1604E" /> shows 1604-E.
export default function Annual1604FPage({ form = '1604F' }) {
  const meta = FORMS[form]
  const { agents, id: agentId, agent, setId, loading: agentsLoading } = useAgents()
  const [opts, setOpts] = useState({ year: new Date().getFullYear() - 1, variant: 'annual', amended: 0, sheets: 0 })
  // BIR Filing Status links here with ?agent=&year=
  const [search] = useSearchParams()
  const linked = useRef(!!search.get('year'))
  useEffect(() => {
    const year = Number(search.get('year'))
    if (year) setOpts((o) => ({ ...o, year }))
    if (search.get('agent')) setId(search.get('agent'))
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [sending, setSending] = useState(null) // params of the open Send window
  const set = (k, v) => setOpts((o) => ({ ...o, [k]: v }))

  const { data, loading: dataLoading, error: loadError, reload: reloadData } = useLoad(() => agentId && annualApi.get(agentId, { ...opts, form }), [agentId, opts, form])
  const loading = agentsLoading || dataLoading

  // Last year and this year at a glance: lines and whether the return was sent (GET /api/filing-status).
  const thisYear = new Date().getFullYear()
  const lastYearStats = usePeriodStats(agentId, thisYear - 1)
  const thisYearStats = usePeriodStats(agentId, thisYear)
  const years = [[thisYear - 1, lastYearStats], [thisYear, thisYearStats]]
  const reload = () => { reloadData(); lastYearStats.reload(); thisYearStats.reload() }
  // The page opens on last year; if only this year has lines, open on this year instead (once per company).
  const autoPicked = useRef('')
  useEffect(() => {
    if (!agentId || !lastYearStats.ready || !thisYearStats.ready || autoPicked.current === agentId) return
    autoPicked.current = agentId
    if (linked.current) { linked.current = false; return }
    if (!lastYearStats.count(form) && thisYearStats.count(form)) setOpts((o) => ({ ...o, year: thisYear }))
  }, [agentId, lastYearStats, thisYearStats, form, thisYear])

  const download = () => {
    setDownloading(true); setError('')
    annualApi.download(agentId, { ...opts, form }).catch((e) => setError(errorMessage(e))).finally(() => setDownloading(false))
  }

  const id = form.toLowerCase()
  return (
    <>
      <PageHeader title={meta.title} sub={meta.sub} />
      <LoadError error={loadError} onRetry={reload} />
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {!agentsLoading && agents.length === 0 && <Alert variant="info">Add your company under <Link to="/alphalist/agents">Withholding Agents</Link> first.</Alert>}
      {agentId && (
        <div className="fp-periods mb-3" aria-label="Years">
          <span className="fp-periods-title">Lines from {meta.from}:</span>
          {years.map(([y, st]) => {
            const n = st.count(form)
            const p = st.periods([form])[0]
            const [variant, text] = { sent: ['success', 'Sent'], changed: ['warning', 'Changed since send'], overdue: ['danger', 'Overdue'] }[p?.status] ?? (n ? ['secondary', 'Not sent'] : ['light', 'No lines'])
            return (
              <button key={y} type="button" className={`fp-period-chip ${opts.year === y ? 'is-current' : ''}`} aria-pressed={opts.year === y} onClick={() => set('year', y)}>
                <strong>{y}</strong>
                {st.ready ? <span className="text-muted">{n} line{n === 1 ? '' : 's'}{p ? ` · ₱${money(p.tax_withheld)}` : ''}</span> : <Spinner size="sm" aria-label="Loading" />}
                {st.ready && <Badge bg={variant} text={variant === 'warning' || variant === 'light' ? 'dark' : undefined}>{text}</Badge>}
              </button>
            )
          })}
        </div>
      )}
      <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">
        <Form.Group controlId={`${id}-year`}>
          <Form.Label visuallyHidden>Year</Form.Label>
          <Form.Control type="number" min={2000} max={2099} style={{ width: 100 }} value={opts.year} onChange={(e) => set('year', Number(e.target.value))} />
        </Form.Group>
        {form === '1604F' && (
          <Form.Group controlId={`${id}-variant`}>
            <Form.Label visuallyHidden>DAT layout</Form.Label>
            <Form.Select style={{ width: 260, maxWidth: '100%' }} value={opts.variant} onChange={(e) => set('variant', e.target.value)}>
              <option value="annual">1604F menu (4-column header)</option>
              <option value="qap">QAP menu "Generate 1604F File"</option>
            </Form.Select>
          </Form.Group>
        )}
        {form === '1604F' && opts.variant === 'qap' && (
          <>
            <Form.Check id={`${id}-amended`} label="Amended" checked={!!opts.amended} onChange={(e) => set('amended', e.target.checked ? 1 : 0)} />
            <Form.Group controlId={`${id}-sheets`} className="d-flex align-items-center gap-2">
              <Form.Label className="mb-0 small">Sheets</Form.Label>
              <Form.Control type="number" min={0} style={{ width: 90 }} value={opts.sheets} onChange={(e) => set('sheets', Number(e.target.value))} />
            </Form.Group>
          </>
        )}
        <div className="ms-auto d-flex gap-2">
          <Button variant="light" disabled={!data || downloading} onClick={download}>{downloading && <Spinner size="sm" aria-hidden />} Download DAT</Button>
          <Button variant="dark" disabled={!data || data.empty} onClick={() => setSending({ form, year: opts.year })}>Send to Alphalist</Button>
        </div>
      </div>
      {data?.alphalist && !data.alphalist.found && <Alert variant="warning">{data.alphalist.error}</Alert>}
      {data?.alphalist?.locked && <Alert variant="warning">BIR Alphalist is open. Close it before sending.</Alert>}
      {loading && !data && agents.length > 0 && (
        <div aria-busy>
          <Placeholder as="h5" animation="glow"><Placeholder xs={4} className="rounded" /></Placeholder>
          <div className="fp-card mb-3">
            <Table className="mb-0"><tbody><SkeletonRows cols={4} rows={2} /></tbody></Table>
          </div>
        </div>
      )}
      {data && (
        <div className={dataLoading ? 'fp-table-loading' : undefined}>
          <h5>{data.filename}</h5>
          {data.empty && <Alert variant="warning">No {meta.from} lines found for {agent ? agentName(agent) : 'this company'} in {data.year}.</Alert>}
          {Object.keys(data.schedules || {}).length > 0 && (
            <div className="fp-card mb-3">
              <Table responsive className="mb-0 fp-stack">
                <thead><tr><th>Schedule</th><th className="fp-num">Lines</th><th className="fp-num">Income payment</th><th className="fp-num">Tax withheld</th></tr></thead>
                <tbody>
                  {Object.entries(data.schedules).map(([sch, s]) => (
                    <tr key={sch}><td>{sch}</td><td className="fp-num">{s.rows}</td><td className="fp-num">{money(s.totals.income_payment)}</td><td className="fp-num">{money(s.totals.tax_withheld)}</td></tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          <BirValidation agentId={agentId} agentTin={agent?.tin} version={data} empty={data.empty}
            period={{ form, year: opts.year, ...(form === '1604F' ? { variant: opts.variant, amended: opts.amended, sheets: opts.sheets } : {}) }} />
          {data.last_sync && <div className="fp-sub mb-3">Last sent to Alphalist: {new Date(data.last_sync.created_at).toLocaleString()} ({data.last_sync.rows_added} lines)</div>}
          <AnalysisView analysis={data.analysis} />
          <h5 className="mt-4">DAT contents</h5>
          <Card body className="bg-light"><pre className="mb-0" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{data.lines.join('\n')}</pre></Card>
        </div>
      )}
      {sending && <SendDialog agentId={agentId} params={sending} label={`${form}, year ${opts.year}`} onClose={() => setSending(null)} onSent={reload} />}
    </>
  )
}

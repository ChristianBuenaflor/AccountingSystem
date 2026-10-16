import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Form, Table } from 'react-bootstrap'
import { alphalistApi, annualApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import AgentPicker, { useAgents } from '../../components/AgentPicker'
import AnalysisView from '../../components/AnalysisView'
import PageHeader from '../../components/PageHeader'

const FORMS = {
  '1604F': { title: '1604-F Annual Return', sub: "Built from the year's 1601-FQ lines (Sch. 1 → 4, Sch. 2 → 5, Sch. 3 → 6).", from: '1601-FQ' },
  '1604E': { title: '1604-E Annual Return', sub: "Built from the year's 1601-EQ lines (Sch. 1 → 3, Sch. 2 → 4).", from: '1601-EQ' },
}

// One screen for both annual returns: <Annual1604FPage form="1604E" /> shows 1604-E.
export default function Annual1604FPage({ form = '1604F' }) {
  const meta = FORMS[form]
  const { agents, id: agentId, setId } = useAgents()
  const [opts, setOpts] = useState({ year: new Date().getFullYear() - 1, variant: 'annual', amended: 0, sheets: 0 })
  const [data, setData] = useState(null)
  const [msg, setMsg] = useState(null)
  const set = (k, v) => setOpts((o) => ({ ...o, [k]: v }))

  const load = useCallback(() => {
    if (!agentId) return
    annualApi.get(agentId, { ...opts, form }).then(setData).catch((e) => { setData(null); setMsg({ variant: 'danger', text: errorMessage(e) }) })
  }, [agentId, opts, form])
  useEffect(load, [load])

  const send = async () => {
    if (!window.confirm(`Write these ${form} lines into BIR Alphalist? Alphalist must be closed. A backup is taken first.`)) return
    try {
      const { message, where } = await alphalistApi.send(agentId, { form, year: opts.year })
      setMsg({ variant: 'success', text: `${message} In Alphalist: ${where}.` })
      load()
    } catch (e) { setMsg({ variant: 'danger', text: errorMessage(e) }) }
  }
  const download = () => annualApi.download(agentId, { ...opts, form }).catch((e) => setMsg({ variant: 'danger', text: errorMessage(e) }))

  return (
    <>
      <PageHeader title={meta.title} sub={meta.sub}>
        <AgentPicker agents={agents} value={agentId} onChange={setId} />
      </PageHeader>
      {msg && <Alert variant={msg.variant} dismissible onClose={() => setMsg(null)}>{msg.text}</Alert>}
      <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">
        <Form.Control type="number" style={{ width: 100 }} value={opts.year} onChange={(e) => set('year', Number(e.target.value))} />
        {form === '1604F' && (
          <Form.Select style={{ width: 260 }} value={opts.variant} onChange={(e) => set('variant', e.target.value)}>
            <option value="annual">1604F menu (4-column header)</option>
            <option value="qap">QAP menu "Generate 1604F File"</option>
          </Form.Select>
        )}
        {form === '1604F' && opts.variant === 'qap' && (
          <>
            <Form.Check label="Amended" checked={!!opts.amended} onChange={(e) => set('amended', e.target.checked ? 1 : 0)} />
            <Form.Control type="number" min={0} style={{ width: 100 }} placeholder="Sheets" value={opts.sheets} onChange={(e) => set('sheets', Number(e.target.value))} />
          </>
        )}
        <div className="ms-auto d-flex gap-2">
          <Button variant="light" disabled={!data} onClick={download}>Download DAT</Button>
          <Button variant="dark" disabled={!data || data.empty} onClick={send}>Send to Alphalist</Button>
        </div>
      </div>
      {data?.alphalist && !data.alphalist.found && <Alert variant="warning">{data.alphalist.error}</Alert>}
      {data?.alphalist?.locked && <Alert variant="warning">BIR Alphalist is open. Close it before sending.</Alert>}
      {data && (
        <>
          <h5>{data.filename}</h5>
          {data.empty && <Alert variant="warning">No {meta.from} lines found for {data.year}.</Alert>}
          {Object.keys(data.schedules || {}).length > 0 && (
            <div className="fp-card mb-3">
              <Table responsive className="mb-0">
                <thead><tr><th>Schedule</th><th>Lines</th><th>Income payment</th><th>Tax withheld</th></tr></thead>
                <tbody>
                  {Object.entries(data.schedules).map(([sch, s]) => (
                    <tr key={sch}><td>{sch}</td><td>{s.rows}</td><td>{s.totals.income_payment ?? ''}</td><td>{s.totals.tax_withheld ?? ''}</td></tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          {data.last_sync && <div className="fp-sub mb-3">Last sent to Alphalist: {new Date(data.last_sync.created_at).toLocaleString()} ({data.last_sync.rows_added} lines)</div>}
          <AnalysisView analysis={data.analysis} />
          <h5 className="mt-4">DAT contents</h5>
          <Card body className="bg-light"><pre className="mb-0" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{data.lines.join('\n')}</pre></Card>
        </>
      )}
    </>
  )
}

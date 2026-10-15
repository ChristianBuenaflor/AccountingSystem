import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Form, Table } from 'react-bootstrap'
import { alphalistApi, annualApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import AgentPicker, { useAgents } from '../../components/AgentPicker'
import AnalysisView from '../../components/AnalysisView'
import PageHeader from '../../components/PageHeader'

export default function Annual1604FPage() {
  const { agents, id: agentId, setId } = useAgents()
  const [opts, setOpts] = useState({ year: new Date().getFullYear() - 1, variant: 'annual', amended: 0, sheets: 0 })
  const [data, setData] = useState(null)
  const [msg, setMsg] = useState(null)
  const set = (k, v) => setOpts((o) => ({ ...o, [k]: v }))

  const load = useCallback(() => {
    if (!agentId) return
    annualApi.get(agentId, opts).then(setData).catch((e) => { setData(null); setMsg({ variant: 'danger', text: errorMessage(e) }) })
  }, [agentId, opts])
  useEffect(load, [load])

  const send = async () => {
    if (!window.confirm('Write these 1604-F lines into BIR Alphalist? Alphalist must be closed. A backup is taken first.')) return
    try {
      const { log } = await alphalistApi.send(agentId, { form: '1604F', year: opts.year })
      setMsg({ variant: 'success', text: `Sent ${log.rows_added} line(s) to BIR Alphalist${log.rows_replaced ? ` (replaced ${log.rows_replaced})` : ''}. Open Alphalist, go to 1604F and pick year ${opts.year}.` })
      load()
    } catch (e) { setMsg({ variant: 'danger', text: errorMessage(e) }) }
  }

  const qa = data?.quarters || []
  return (
    <>
      <PageHeader title="1604-F Annual Return" sub="Built from the year's 1601-FQ lines (Sch. 1 → 4, Sch. 2 → 5, Sch. 3 → 6).">
        <AgentPicker agents={agents} value={agentId} onChange={setId} />
      </PageHeader>
      {msg && <Alert variant={msg.variant} dismissible onClose={() => setMsg(null)}>{msg.text}</Alert>}
      <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">
        <Form.Control type="number" style={{ width: 100 }} value={opts.year} onChange={(e) => set('year', Number(e.target.value))} />
        <Form.Select style={{ width: 260 }} value={opts.variant} onChange={(e) => set('variant', e.target.value)}>
          <option value="annual">1604F menu (4-column header)</option>
          <option value="qap">QAP menu "Generate 1604F File"</option>
        </Form.Select>
        {opts.variant === 'qap' && (
          <>
            <Form.Check label="Amended" checked={!!opts.amended} onChange={(e) => set('amended', e.target.checked ? 1 : 0)} />
            <Form.Control type="number" min={0} style={{ width: 100 }} placeholder="Sheets" value={opts.sheets} onChange={(e) => set('sheets', Number(e.target.value))} />
          </>
        )}
        <div className="ms-auto d-flex gap-2">
          <Button variant="light" disabled={!data} href={data ? annualApi.downloadUrl(agentId, opts) : undefined}>Download DAT</Button>
          <Button variant="dark" disabled={!data} onClick={send}>Send to Alphalist</Button>
        </div>
      </div>
      {data?.alphalist && !data.alphalist.found && <Alert variant="warning">{data.alphalist.error}</Alert>}
      {data?.alphalist?.locked && <Alert variant="warning">BIR Alphalist is open. Close it before sending.</Alert>}
      {data && (
        <>
          <h5>{data.filename}</h5>
          {data.empty && <Alert variant="warning">No 1601-FQ lines found for {data.year}.</Alert>}
          {qa.length > 0 && (
            <div className="fp-card mb-3">
              <Table responsive className="mb-0">
                <thead><tr><th>Quarter</th><th>Schedule</th><th>Lines</th></tr></thead>
                <tbody>{qa.map((r, i) => <tr key={i}><td>Q{r.quarter}</td><td>{r.schedule}</td><td>{r.lines}</td></tr>)}</tbody>
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

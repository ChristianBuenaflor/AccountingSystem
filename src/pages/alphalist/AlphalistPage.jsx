import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Table } from 'react-bootstrap'
import { alphalistApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import PageHeader from '../../components/PageHeader'
import { agentName } from '../../components/AgentPicker'

export default function AlphalistPage() {
  const [d, setD] = useState(null)
  const [msg, setMsg] = useState(null)
  const load = () => alphalistApi.overview().then(setD).catch((e) => setMsg({ variant: 'danger', text: errorMessage(e) }))
  useEffect(() => { load() }, [])

  const restore = async (name) => {
    if (!window.confirm(`Restore Alphalist's data from ${name}? This replaces its current data.`)) return
    try { await alphalistApi.restore(name); setMsg({ variant: 'success', text: `Restored from ${name}.` }); load() }
    catch (e) { setMsg({ variant: 'danger', text: errorMessage(e) }) }
  }
  const s = d?.status

  return (
    <>
      <PageHeader title="BIR Alphalist" sub="Connection to the Alphalist Data Entry program on this PC, its backups, and send history." />
      {msg && <Alert variant={msg.variant} dismissible onClose={() => setMsg(null)}>{msg.text}</Alert>}
      {s && (
        <div className="fp-card p-3 mb-3">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <strong>{s.path}</strong>
            <Badge bg={s.found ? 'success' : 'danger'}>{s.found ? 'Found' : 'Not found'}</Badge>
            {s.found && <Badge bg={s.locked ? 'warning' : 'secondary'} text={s.locked ? 'dark' : undefined}>{s.locked ? 'Open (locked)' : 'Closed'}</Badge>}
            {s.agent && <span className="fp-sub">Registered agent: {s.agent.name ?? s.agent.tin ?? JSON.stringify(s.agent)}</span>}
          </div>
          {s.error && <Alert variant="warning" className="mt-3 mb-0">{s.error}</Alert>}
        </div>
      )}
      <h5 className="mt-4">Backups</h5>
      <div className="fp-card mb-4">
        <Table responsive className="mb-0 align-middle">
          <thead><tr><th>Backup</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {!d?.backups.length && <tr><td colSpan={3} className="fp-empty">No backups yet.</td></tr>}
            {d?.backups.map((b) => (
              <tr key={b.name}><td>{b.name}</td><td>{new Date(b.created * 1000).toLocaleString()}</td>
                <td><Button size="sm" variant="outline-danger" onClick={() => restore(b.name)}>Restore</Button></td></tr>
            ))}
          </tbody>
        </Table>
      </div>
      <h5>Send history</h5>
      <div className="fp-card">
        <Table responsive className="mb-0">
          <thead><tr><th>When</th><th>Agent</th><th>Form</th><th>Period</th><th>Added</th><th>Replaced</th></tr></thead>
          <tbody>
            {!d?.syncs.length && <tr><td colSpan={6} className="fp-empty">Nothing sent yet.</td></tr>}
            {d?.syncs.map((x) => (
              <tr key={x.id}><td>{new Date(x.created_at).toLocaleString()}</td><td>{x.agent ? agentName(x.agent) : ''}</td><td>{x.form_type}</td><td>{String(x.return_period).slice(0, 10)}</td><td>{x.rows_added}</td><td>{x.rows_replaced}</td></tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  )
}

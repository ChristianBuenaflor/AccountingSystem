import { useState } from 'react'
import { Alert, Badge, Button } from 'react-bootstrap'
import { alphalistApi } from '../lib/api/alphalist'
import { errorMessage } from '../lib/api/client'
import { agentName } from './AgentPicker'

const pad4 = (v) => String(v ?? '').padStart(4, '0')

// "Send to BIR Alphalist on this PC" - mirrors alphalist/_send.blade.php
export default function SendPanel({ agent, alphalist, form, year, quarter, label, lastSync, onSent }) {
  const [msg, setMsg] = useState(null)
  if (!agent || !alphalist) return null
  const reg = alphalist.agent
  const sameAgent = reg && reg.tin === agent.tin && pad4(reg.branch_code) === agent.branch_code
  const canSend = alphalist.found && !alphalist.locked && (!reg || sameAgent)

  const send = async () => {
    if (!window.confirm(`Send ${label} to BIR Alphalist?\n\nAlphalist's DATA folder is backed up first. Lines Alphalist already has for this agent and period are replaced.`)) return
    try {
      const { log, period } = await alphalistApi.send(agent.id, { form, year, ...(quarter ? { quarter } : {}) })
      const shown = form === '1604F' ? `year ${year}` : new Date(period + 'T00:00').toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })
      setMsg({ variant: 'success', text: `Sent ${log.rows_added} line(s) to BIR Alphalist${log.rows_replaced ? ` (replaced ${log.rows_replaced} older line(s))` : ''}. ${log.notes ?? ''} Open Alphalist and choose return period ${shown} to see them.` })
      onSent?.()
    } catch (e) { setMsg({ variant: 'danger', text: errorMessage(e) }) }
  }

  return (
    <div className="fp-card p-3 mb-3" style={{ borderLeft: '4px solid var(--fp-accent)' }}>
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <strong>Send to BIR Alphalist on this PC</strong>
          <div className="fp-sub">Puts these lines straight into Alphalist, so they appear on its {label} screens.</div>
        </div>
        {canSend && <Button className="btn-fp" onClick={send}>Send to Alphalist</Button>}
      </div>
      <ul className="mt-2 mb-0 small">
        {!alphalist.found ? <li className="text-danger">{alphalist.error}</li>
          : alphalist.locked ? <li className="text-danger"><strong>Alphalist is open.</strong> Close it completely (Exit on its main menu), then reload. Sending is blocked while it runs.</li>
          : <>
            <li><Badge bg="success">Ready</Badge> Alphalist found at <code>{alphalist.path}</code> and closed.</li>
            {!reg && <li>No withholding agent is registered in Alphalist yet: <strong>{agentName(agent)}</strong> will be registered with this send.</li>}
            {reg && sameAgent && <li>Alphalist is registered to this agent (TIN <code>{reg.tin}-{pad4(reg.branch_code)}</code>).</li>}
            {reg && !sameAgent && <li className="text-danger">Alphalist is registered to another agent, <strong>{reg.name}</strong> (TIN {reg.tin}-{pad4(reg.branch_code)}). It holds one agent at a time, so sending is blocked.</li>}
          </>}
        {lastSync && <li className="text-muted">Last sent {new Date(lastSync.created_at).toLocaleString()}: {lastSync.rows_added} line(s).</li>}
      </ul>
      {msg && <Alert variant={msg.variant} className="mt-3 mb-0" dismissible onClose={() => setMsg(null)}>{msg.text}</Alert>}
    </div>
  )
}

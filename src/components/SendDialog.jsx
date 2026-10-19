import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Modal, Spinner } from 'react-bootstrap'
import { alphalistApi } from '../lib/api/alphalist'
import { errorMessage } from '../lib/api/client'
import { refreshAlphalist } from './AgentPicker'

const pad4 = (v) => String(v ?? '').padStart(4, '0')

// "Send to Alphalist", step by step in one window: what will be written -> Send -> the result.
// params = { form, year, quarter? , month? }, label e.g. "SAWT 2550M, Sep 2026"
export default function SendDialog({ agentId, params, label, onClose, onSent }) {
  const [state, setState] = useState({ step: 'loading' }) // loading | ready | sending | done | error
  const { step, preview, status, result, error } = state

  useEffect(() => {
    Promise.all([alphalistApi.sendPreview(agentId, params), alphalistApi.status()])
      .then(([preview, status]) => setState({ step: 'ready', preview, status }))
      .catch((e) => setState({ step: 'error', error: errorMessage(e) }))
  }, [agentId, params])

  const send = async () => {
    setState((s) => ({ ...s, step: 'sending' }))
    try {
      const result = await alphalistApi.send(agentId, params)
      setState((s) => ({ ...s, step: 'done', result }))
      refreshAlphalist() // the top bar's badge: Alphalist may now be registered to this agent
      onSent?.(result)
    } catch (e) {
      setState((s) => ({ ...s, step: 'error', error: errorMessage(e) }))
    }
  }

  const blocked = preview && (!status?.found || status?.locked || preview.agent_action === 'conflict' || (preview.lines_to_add === 0 && preview.lines_to_replace === 0))
  const reg = preview?.registered_agent

  return (
    <Modal show onHide={step === 'sending' ? undefined : onClose} centered backdrop={step === 'sending' ? 'static' : true}>
      <Modal.Header closeButton={step !== 'sending'}><Modal.Title>Send to BIR Alphalist</Modal.Title></Modal.Header>
      <Modal.Body>
        <div className="fw-semibold mb-2">{label}</div>
        {step === 'loading' && <div className="text-muted" role="status"><Spinner size="sm" aria-hidden /> Checking Alphalist…</div>}

        {(step === 'ready' || step === 'sending') && preview && (
          <>
            <ul className="mb-3">
              <li><strong>{preview.lines_to_add}</strong> line(s) will be written{Object.keys(preview.lines_by_schedule || {}).length > 1 && ` (${Object.entries(preview.lines_by_schedule).map(([s, n]) => `${s}: ${n}`).join(', ')})`}.</li>
              {preview.lines_to_replace > 0 && <li><strong>{preview.lines_to_replace}</strong> line(s) Alphalist already has for this period will be replaced.</li>}
              <li>Return period: <strong>{preview.return_period}</strong></li>
              {preview.agent_action === 'register' && <li>No agent is registered in Alphalist yet; this agent will be registered.</li>}
              {preview.agent_action === 'same' && <li>Alphalist is registered to this agent ({reg?.tin}-{pad4(reg?.branch_code)}). <Badge bg="success">OK</Badge></li>}
              <li className="text-muted">Alphalist's DATA folder is backed up first; if anything fails it is restored.</li>
            </ul>
            {!status?.found && <Alert variant="danger" className="mb-0">{status?.error || 'BIR Alphalist was not found on this PC.'}</Alert>}
            {status?.locked && <Alert variant="warning" className="mb-0"><strong>BIR Alphalist is open.</strong> Exit it completely (Exit on its main menu), then press Send again.</Alert>}
            {preview.agent_action === 'conflict' && <Alert variant="danger" className="mb-0">Alphalist is registered to another agent, <strong>{reg?.name}</strong> ({reg?.tin}-{pad4(reg?.branch_code)}). It holds one agent at a time. Remove that agent on the BIR Alphalist page first.</Alert>}
            {status?.found && !status?.locked && preview.agent_action !== 'conflict' && preview.lines_to_add === 0 && preview.lines_to_replace === 0 && <Alert variant="warning" className="mb-0">There are no lines for this period.</Alert>}
          </>
        )}

        {step === 'done' && (
          <Alert variant="success" className="mb-0">
            <div className="fw-semibold">{result.message}</div>
            <div className="mt-2">To see them, open BIR Alphalist: <strong>{result.where}</strong>.</div>
          </Alert>
        )}
        {step === 'error' && <Alert variant="danger" className="mb-0">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        {step === 'done' || step === 'error'
          ? <Button className="btn-fp" onClick={onClose}>Close</Button>
          : <>
            <Button variant="light" disabled={step === 'sending'} onClick={onClose}>Cancel</Button>
            {step === 'ready' && status?.locked && <Button variant="outline-secondary" onClick={() => { setState({ step: 'loading' }); Promise.all([alphalistApi.sendPreview(agentId, params), alphalistApi.status()]).then(([p, s]) => setState({ step: 'ready', preview: p, status: s })).catch((e) => setState({ step: 'error', error: errorMessage(e) })) }}>Check again</Button>}
            <Button variant="dark" disabled={step !== 'ready' || blocked} onClick={send}>
              {step === 'sending' ? <><Spinner size="sm" aria-hidden /> Sending…</> : 'Send'}
            </Button>
          </>}
      </Modal.Footer>
    </Modal>
  )
}

import { useEffect, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Form, Spinner } from 'react-bootstrap'
import { Building, ExclamationTriangleFill } from 'react-bootstrap-icons'
import { agentsApi, alphalistApi } from '../lib/api/alphalist'
import { errorMessage } from '../lib/api/client'

export const agentName = (a) => a.registered_name || [a.last_name, a.first_name, a.middle_name].filter(Boolean).join(' ')
export const payeeName = (p) => p?.registered_name || [p?.last_name, p?.first_name].filter(Boolean).join(', ')
export const pad4 = (v) => String(v ?? '').padStart(4, '0')
// The FinancePro agent BIR Alphalist is registered to (Alphalist holds one agent at a time).
export const sameAgent = (a, reg) => !!(a && reg && a.tin === reg.tin && pad4(a.branch_code) === pad4(reg.branch_code))

// ---------------------------------------------------------------- one company for every page
// The company (withholding agent) picked in the top bar, shared by every page and remembered in localStorage fp.agent,
// plus what BIR Alphalist on this PC is registered to (GET /api/alphalist/status).
const KEY = 'fp.agent'
const read = () => { try { return localStorage.getItem(KEY) || '' } catch { return '' } }
const EMPTY = { agents: [], loaded: false, loading: false, error: '', picked: read(), alphalist: null, checking: false, checkedAt: 0 }
let state = EMPTY
const listeners = new Set()
const set = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()) }
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

let listing = Promise.resolve()
export function reloadAgents() {
  set({ loading: true })
  return (listing = agentsApi.list()
    .then((agents) => set({ agents, loaded: true, loading: false, error: '' }))
    .catch((e) => set({ loaded: true, loading: false, error: errorMessage(e) })))
}

let checking = null
export function refreshAlphalist() {
  if (!checking) {
    set({ checking: true })
    checking = alphalistApi.status()
      .then((alphalist) => set({ alphalist, checking: false, checkedAt: Date.now() }))
      .catch((e) => set({ alphalist: { found: false, error: errorMessage(e) }, checking: false, checkedAt: Date.now() }))
      .finally(() => { checking = null })
  }
  return checking
}

export const setAgentId = (v) => {
  try { localStorage.setItem(KEY, String(v ?? '')) } catch { /* private window: remembered for this visit only */ }
  set({ picked: String(v ?? '') })
}

// Signing out forgets the lists (not the pick).
export const resetAgents = () => set({ ...EMPTY, picked: read() })

// { agents, id, agent, setId, loading, error, alphalist, registered, isRegistered, registeredAgent }
export function useAgents() {
  const s = useSyncExternalStore(subscribe, () => state)
  useEffect(() => {
    // The page waits on the agents; the status read (slow: Alphalist's DBF files) goes after them,
    // since the API answers one request at a time.
    const agents = (!state.loaded || state.error) && !state.loading ? reloadAgents() : listing
    agents.then(() => { if (!state.alphalist && !state.checking) refreshAlphalist() })
  }, [])
  const agent = s.agents.find((a) => String(a.id) === s.picked) ?? s.agents[0] ?? null
  const registered = s.alphalist?.agent ?? null
  return {
    agents: s.agents,
    id: agent?.id ?? '',
    agent,
    setId: setAgentId,
    loading: !s.loaded,
    error: s.error,
    alphalist: s.alphalist,
    checking: s.checking,
    registered,
    isRegistered: sameAgent(agent, registered),
    registeredAgent: s.agents.find((a) => sameAgent(a, registered)) ?? null,
  }
}

// ---------------------------------------------------------------- top bar
function AlphalistBadge({ alphalist, checking, isRegistered }) {
  let badge
  if (!alphalist) badge = <span className="fp-sub small d-flex align-items-center gap-1"><Spinner size="sm" aria-hidden /> Alphalist…</span>
  else if (!alphalist.found) badge = <Badge bg="secondary">Alphalist not found</Badge>
  else if (alphalist.locked) badge = <Badge bg="warning" text="dark">Alphalist is open</Badge>
  else if (!alphalist.agent) badge = <Badge bg="light" text="dark" className="border">Alphalist: no agent yet</Badge>
  else {
    badge = (
      <Badge bg={isRegistered ? 'success' : 'warning'} text={isRegistered ? undefined : 'dark'} className="fp-agent-badge">
        {isRegistered ? 'In BIR Alphalist' : `Alphalist: ${alphalist.agent.name}`}
      </Badge>
    )
  }
  const title = alphalist?.agent
    ? `BIR Alphalist on this PC is registered to ${alphalist.agent.name} (${alphalist.agent.tin}-${pad4(alphalist.agent.branch_code)})`
    : alphalist?.error || (alphalist?.locked ? 'BIR Alphalist is open, so its registered agent cannot be read. Close it to check.' : 'BIR Alphalist on this PC')
  return (
    <Link to="/alphalist/sync" className="text-decoration-none d-flex align-items-center gap-1" title={title} aria-label={title}>
      {badge}{checking && alphalist && <Spinner size="sm" className="text-muted" aria-hidden />}
    </Link>
  )
}

export function AgentSwitcher() {
  const { agents, id, setId, loading, error, alphalist, checking, registered, isRegistered } = useAgents()

  // Alphalist may have been opened, closed or re-registered meanwhile: look again when the user comes back.
  useEffect(() => {
    const again = () => { if (document.visibilityState === 'visible' && Date.now() - state.checkedAt > 30000) refreshAlphalist() }
    window.addEventListener('focus', again)
    document.addEventListener('visibilitychange', again)
    return () => { window.removeEventListener('focus', again); document.removeEventListener('visibilitychange', again) }
  }, [])

  return (
    <div className="fp-agent">
      <Building className="text-muted flex-shrink-0 d-none d-sm-block" aria-hidden />
      <Form.Label htmlFor="fp-agent" className="visually-hidden">Company (withholding agent)</Form.Label>
      <Form.Select id="fp-agent" size="sm" value={id} disabled={loading || agents.length === 0} onChange={(e) => setId(e.target.value)}
        title="The company (withholding agent) every BIR page shows" isInvalid={!!error}>
        {loading && <option value="">Loading companies…</option>}
        {!loading && agents.length === 0 && <option value="">{error ? 'Cannot load companies' : 'No withholding agents yet'}</option>}
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{agentName(a)} ({a.tin}-{pad4(a.branch_code)}){sameAgent(a, registered) ? ' · in BIR Alphalist' : ''}</option>
        ))}
      </Form.Select>
      {!loading && agents.length === 0 && !error && <Link to="/alphalist/agents" className="small text-nowrap">Add one</Link>}
      <AlphalistBadge alphalist={alphalist} checking={checking} isRegistered={isRegistered} />
    </div>
  )
}

// Under the top bar on the pages that send to Alphalist: the company shown is not the one Alphalist holds.
export function AgentMismatchBar() {
  const { agent, alphalist, registered, isRegistered, registeredAgent, setId } = useAgents()
  if (!agent || !alphalist?.found || alphalist.locked || !registered || isRegistered) return null
  return (
    <div className="fp-mismatch" role="status">
      <ExclamationTriangleFill className="flex-shrink-0" aria-hidden />
      <div className="fp-mismatch-text">
        BIR Alphalist on this PC is registered to <strong>{registered.name}</strong> ({registered.tin}-{pad4(registered.branch_code)}), but you are viewing <strong>{agentName(agent)}</strong>.
        Sending this company's lines is blocked until Alphalist holds it.
      </div>
      <div className="d-flex gap-2 flex-wrap">
        {registeredAgent && <Button size="sm" variant="dark" onClick={() => setId(registeredAgent.id)}>Switch to {agentName(registeredAgent)}</Button>}
        <Link to="/alphalist/sync" className="btn btn-sm btn-outline-dark">BIR Alphalist…</Link>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Form } from 'react-bootstrap'
import { agentsApi } from '../lib/api/alphalist'

export const agentName = (a) => a.registered_name || [a.last_name, a.first_name, a.middle_name].filter(Boolean).join(' ')
export const payeeName = (p) => p?.registered_name || [p?.last_name, p?.first_name].filter(Boolean).join(', ')

// Loads agents and remembers the selected one between pages.
export function useAgents() {
  const [agents, setAgents] = useState([])
  const [id, setIdState] = useState(localStorage.getItem('fp.agent') || '')
  useEffect(() => { agentsApi.list().then(setAgents).catch(() => {}) }, [])
  const setId = (v) => { setIdState(v); localStorage.setItem('fp.agent', v) }
  const selected = agents.find((a) => String(a.id) === String(id)) ? id : agents[0]?.id ?? ''
  return { agents, id: selected, setId }
}

export default function AgentPicker({ agents, value, onChange }) {
  return (
    <Form.Select style={{ maxWidth: 320 }} value={value} onChange={(e) => onChange(e.target.value)}>
      {agents.length === 0 && <option value="">No withholding agents yet</option>}
      {agents.map((a) => <option key={a.id} value={a.id}>{agentName(a)} ({a.tin})</option>)}
    </Form.Select>
  )
}

import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Table } from 'react-bootstrap'
import { PencilSquare, Plus, Trash } from 'react-bootstrap-icons'
import { agentsApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import FormModal, { saveError } from '../../components/FormModal'
import { LoadError, SkeletonRows } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import { agentName, pad4, reloadAgents, sameAgent, useAgents } from '../../components/AgentPicker'
import { confirmDialog } from '../../lib/confirm'
import { toast } from '../../lib/toast'

const isI = (v) => v.classification === 'I'
const text = (name, label, extra = {}) => ({ name, label, ...extra })

export default function AgentsPage() {
  // The same list the top bar's company switcher shows, so both stay in step.
  const { agents, id: currentId, setId, loading, error: loadError, registered } = useAgents()
  const [rdos, setRdos] = useState([])
  const [edit, setEdit] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { agentsApi.rdos().then(setRdos).catch(() => {}) }, [])

  const fields = [
    text('tin', 'TIN (9 digits)', { col: 4, required: true }), text('branch_code', 'Branch code', { col: 4 }),
    text('rdo_code', 'RDO', { type: 'select', col: 4, options: [['', 'Select RDO'], ...rdos.map((r) => [r.code, `${r.code} ${r.name ?? ''}`])] }),
    text('classification', 'Classification', { type: 'select', options: [['N', 'Non-individual'], ['I', 'Individual']] }),
    text('category', 'Category', { type: 'select', options: [['P', 'Private'], ['G', 'Government']] }),
    text('registered_name', 'Registered name', { col: 12, show: (v) => !isI(v), required: true }),
    text('last_name', 'Last name', { col: 4, show: isI, required: true }), text('first_name', 'First name', { col: 4, show: isI }), text('middle_name', 'Middle name', { col: 4, show: isI }),
    text('substreet', 'Sub-street', { col: 4 }), text('street', 'Street', { col: 4 }), text('barangay', 'Barangay', { col: 4 }),
    text('district', 'District', { col: 4 }), text('city', 'City', { col: 4 }), text('zip_code', 'ZIP', { col: 4 }),
    text('line_of_business', 'Line of business'), text('phone', 'Phone'),
  ]

  const save = (a) => agentsApi.save(a)
    .then((saved) => { toast(`${agentName(saved ?? a)} saved.`); return reloadAgents() })
    .catch((e) => { throw saveError(e) })
  const remove = async (a) => {
    if (!await confirmDialog(`Archive ${agentName(a)}? It disappears from the lists; its QAP lines are kept.`, { ok: 'Archive', variant: 'danger' })) return
    try { await agentsApi.remove(a.id); toast(`${agentName(a)} archived.`); reloadAgents() } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader title="Withholding Agents" sub="Employers who file QAP 1601-EQ/FQ, 1604-E and 1604-F. The company picked in the top bar is the one every BIR page shows.">
        <Button className="btn-fp" onClick={() => setEdit({ branch_code: '0000', classification: 'N', category: 'P' })}><Plus size={20} aria-hidden /> New Agent</Button>
      </PageHeader>
      <LoadError error={loadError} onRetry={reloadAgents} />
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <div className="fp-card">
        <Table responsive className="mb-0 align-middle fp-stack" aria-busy={loading}>
          <thead><tr><th className="fp-hide-narrow">#</th><th>TIN</th><th>Name</th><th className="fp-hide-narrow">RDO</th><th className="fp-num">Lines</th><th className="fp-actions"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            {loading && <SkeletonRows cols={6} hide={[0, 3]} />}
            {!loading && agents.length === 0 && <tr><td colSpan={6} className="fp-empty">No withholding agents yet. Add your company with New Agent.</td></tr>}
            {agents.map((a, i) => (
              <tr key={a.id}>
                <td className="fp-hide-narrow">{i + 1}</td><td className="fp-tin">{a.tin}-{pad4(a.branch_code)}</td>
                <td className="fp-name">
                  {agentName(a)}
                  {String(a.id) === String(currentId) && <Badge bg="light" text="dark" className="border ms-2">shown now</Badge>}
                  {sameAgent(a, registered) && <Badge bg="success" className="ms-2">in BIR Alphalist</Badge>}
                </td>
                <td className="fp-hide-narrow">{a.rdo_code}</td><td className="fp-num">{a.qap_entries_count}</td>
                <td className="fp-actions">
                  {String(a.id) !== String(currentId) && <><Button size="sm" variant="outline-secondary" onClick={() => setId(a.id)}>Show</Button>{' '}</>}
                  <Button size="sm" variant="light" onClick={() => setEdit(a)} aria-label={`Edit ${agentName(a)}`} title="Edit"><PencilSquare aria-hidden /></Button>{' '}
                  <Button size="sm" variant="outline-danger" onClick={() => remove(a)} aria-label={`Archive ${agentName(a)}`} title="Archive"><Trash aria-hidden /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {edit && <FormModal title={edit.id ? 'Edit agent' : 'New agent'} fields={fields} initial={edit} onSave={save} onClose={() => setEdit(null)} idPrefix="agent" />}
    </>
  )
}

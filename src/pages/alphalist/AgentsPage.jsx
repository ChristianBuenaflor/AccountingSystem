import { useEffect, useState } from 'react'
import { Alert, Button, Table } from 'react-bootstrap'
import { Plus } from 'react-bootstrap-icons'
import { agentsApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import FormModal from '../../components/FormModal'
import PageHeader from '../../components/PageHeader'
import { agentName } from '../../components/AgentPicker'

const isI = (v) => v.classification === 'I'
const text = (name, label, extra = {}) => ({ name, label, ...extra })

export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [rdos, setRdos] = useState([])
  const [edit, setEdit] = useState(null)
  const [error, setError] = useState('')

  const load = () => agentsApi.list().then(setAgents).catch((e) => setError(errorMessage(e)))
  useEffect(() => { load(); agentsApi.rdos().then(setRdos).catch(() => {}) }, [])

  const fields = [
    text('tin', 'TIN (9 digits)', { col: 4 }), text('branch_code', 'Branch code', { col: 4 }),
    text('rdo_code', 'RDO', { type: 'select', col: 4, options: [['', 'Select RDO'], ...rdos.map((r) => [r.code, `${r.code} ${r.name ?? ''}`])] }),
    text('classification', 'Classification', { type: 'select', options: [['N', 'Non-individual'], ['I', 'Individual']] }),
    text('category', 'Category', { type: 'select', options: [['P', 'Private'], ['G', 'Government']] }),
    text('registered_name', 'Registered name', { col: 12, show: (v) => !isI(v) }),
    text('last_name', 'Last name', { col: 4, show: isI }), text('first_name', 'First name', { col: 4, show: isI }), text('middle_name', 'Middle name', { col: 4, show: isI }),
    text('substreet', 'Sub-street', { col: 4 }), text('street', 'Street', { col: 4 }), text('barangay', 'Barangay', { col: 4 }),
    text('district', 'District', { col: 4 }), text('city', 'City', { col: 4 }), text('zip_code', 'ZIP', { col: 4 }),
    text('line_of_business', 'Line of business'), text('phone', 'Phone'),
  ]

  const save = (a) => agentsApi.save(a).then(load).catch((e) => { throw new Error(errorMessage(e)) })
  const remove = async (a) => {
    if (!window.confirm(`Delete ${agentName(a)} and all of its QAP entries?`)) return
    try { await agentsApi.remove(a.id); load() } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader title="Withholding Agents" sub="Employers who file QAP 1601-EQ/FQ and 1604-F.">
        <Button className="btn-fp" onClick={() => setEdit({ branch_code: '0000', classification: 'N', category: 'P' })}><Plus size={20} /> New Agent</Button>
      </PageHeader>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <div className="fp-card">
        <Table responsive className="mb-0 align-middle">
          <thead><tr><th>#</th><th>TIN</th><th>Name</th><th>RDO</th><th>Lines</th><th>Actions</th></tr></thead>
          <tbody>
            {agents.length === 0 && <tr><td colSpan={6} className="fp-empty">No withholding agents found.</td></tr>}
            {agents.map((a, i) => (
              <tr key={a.id}>
                <td>{i + 1}</td><td>{a.tin}-{a.branch_code}</td><td>{agentName(a)}</td><td>{a.rdo_code}</td><td>{a.qap_entries_count}</td>
                <td className="text-nowrap">
                  <Button size="sm" variant="light" onClick={() => setEdit(a)}>Edit</Button>{' '}
                  <Button size="sm" variant="outline-danger" onClick={() => remove(a)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {edit && <FormModal title={edit.id ? 'Edit agent' : 'New agent'} fields={fields} initial={edit} onSave={save} onClose={() => setEdit(null)} />}
    </>
  )
}

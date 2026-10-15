import { useEffect, useState } from 'react'
import { Alert, Button, Form, Pagination, Table } from 'react-bootstrap'
import { Plus } from 'react-bootstrap-icons'
import { payeesApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import FormModal from '../../components/FormModal'
import PageHeader from '../../components/PageHeader'
import { payeeName } from '../../components/AgentPicker'

export const STATUS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const isI = (v) => v.payee_type === 'I'

export const payeeFields = [
  { name: 'tin', label: 'TIN (9 digits)', col: 4 }, { name: 'branch_code', label: 'Branch code', col: 4 },
  { name: 'payee_type', label: 'Type', col: 4, type: 'select', options: [['I', 'Individual'], ['N', 'Non-individual']] },
  { name: 'registered_name', label: 'Registered name', col: 12, show: (v) => !isI(v) },
  { name: 'last_name', label: 'Last name', col: 4, show: isI }, { name: 'first_name', label: 'First name', col: 4, show: isI }, { name: 'middle_name', label: 'Middle name', col: 4, show: isI },
  { name: 'status_code', label: 'Status code', type: 'select', options: [['', '-'], ...STATUS.map((s) => [s, s])] },
  { name: 'address1', label: 'Address 1' }, { name: 'address2', label: 'Address 2' },
]

export default function PayeesPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [res, setRes] = useState({ data: [], last_page: 1 })
  const [edit, setEdit] = useState(null)
  const [error, setError] = useState('')

  const load = () => payeesApi.list(q, page).then(setRes).catch((e) => setError(errorMessage(e)))
  useEffect(() => { load() }, [q, page])

  const save = (p) => payeesApi.save(p).then(load).catch((e) => { throw new Error(errorMessage(e)) })
  const remove = async (p) => {
    if (!window.confirm(`Delete ${payeeName(p)}?`)) return
    try { await payeesApi.remove(p.id); load() } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader title="TIN Library" sub="Payees you withhold tax from. Typing a TIN on a QAP line fills these in.">
        <Form.Control placeholder="Search name or TIN" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} style={{ width: 240 }} />
        <Button className="btn-fp" onClick={() => setEdit({ branch_code: '0000', payee_type: 'I' })}><Plus size={20} /> New Payee</Button>
      </PageHeader>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <div className="fp-card">
        <Table responsive className="mb-0 align-middle">
          <thead><tr><th>TIN</th><th>Name</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {res.data.length === 0 && <tr><td colSpan={5} className="fp-empty">No payees found.</td></tr>}
            {res.data.map((p) => (
              <tr key={p.id}>
                <td>{p.tin}-{p.branch_code}</td><td>{payeeName(p)}</td><td>{p.payee_type === 'I' ? 'Individual' : 'Non-individual'}</td><td>{p.status_code}</td>
                <td className="text-nowrap">
                  <Button size="sm" variant="light" onClick={() => setEdit(p)}>Edit</Button>{' '}
                  <Button size="sm" variant="outline-danger" onClick={() => remove(p)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {res.last_page > 1 && (
        <Pagination className="mt-3">
          <Pagination.Prev disabled={page <= 1} onClick={() => setPage(page - 1)} />
          <Pagination.Item active>{page} / {res.last_page}</Pagination.Item>
          <Pagination.Next disabled={page >= res.last_page} onClick={() => setPage(page + 1)} />
        </Pagination>
      )}
      {edit && <FormModal title={edit.id ? 'Edit payee' : 'New payee'} fields={payeeFields} initial={edit} onSave={save} onClose={() => setEdit(null)} />}
    </>
  )
}

import { useState } from 'react'
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap'
import { PencilSquare, Plus, Trash } from 'react-bootstrap-icons'
import { payeesApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import FormModal, { saveError } from '../../components/FormModal'
import { LoadError, SkeletonRows } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import Pager from '../../components/Pager'
import { pad4, payeeName } from '../../components/AgentPicker'
import { confirmDialog } from '../../lib/confirm'
import { toast } from '../../lib/toast'
import useLoad from '../../lib/useLoad'

export const STATUS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const isI = (v) => v.payee_type === 'I'

export const payeeFields = [
  { name: 'tin', label: 'TIN (9 digits)', col: 4, required: true }, { name: 'branch_code', label: 'Branch code', col: 4 },
  { name: 'payee_type', label: 'Type', col: 4, type: 'select', options: [['I', 'Individual'], ['N', 'Non-individual']] },
  { name: 'registered_name', label: 'Registered name', col: 12, show: (v) => !isI(v), required: true },
  { name: 'last_name', label: 'Last name', col: 4, show: isI, required: true }, { name: 'first_name', label: 'First name', col: 4, show: isI }, { name: 'middle_name', label: 'Middle name', col: 4, show: isI },
  { name: 'status_code', label: 'Status code', type: 'select', options: [['', '-'], ...STATUS.map((s) => [s, s])] },
  { name: 'address1', label: 'Address 1' }, { name: 'address2', label: 'Address 2' },
]

export default function PayeesPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [edit, setEdit] = useState(null)
  const [error, setError] = useState('')

  // Searching keeps the current rows (dimmed) until the new ones arrive.
  const { data, loading, error: loadError, reload } = useLoad(() => payeesApi.list(q, page), [q, page], { keep: true })
  const res = data ?? { data: [], last_page: 1 }

  const save = (p) => payeesApi.save(p).then(() => { toast(`${payeeName(p)} saved.`); reload() }).catch((e) => { throw saveError(e) })
  const remove = async (p) => {
    if (!await confirmDialog(`Archive ${payeeName(p)}?`, { ok: 'Archive', variant: 'danger' })) return
    try { await payeesApi.remove(p.id); toast(`${payeeName(p)} archived.`); reload() } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader title="TIN Library" sub="Payees you withhold tax from. Typing a TIN on a QAP line fills these in.">
        <Form.Group controlId="payee-search" className="position-relative">
          <Form.Label visuallyHidden>Search payees</Form.Label>
          <Form.Control type="search" placeholder="Search name or TIN" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} style={{ width: 240, maxWidth: '100%' }} />
          {loading && data && <Spinner size="sm" className="position-absolute text-muted" style={{ right: 10, top: 11 }} aria-label="Searching" />}
        </Form.Group>
        <Button className="btn-fp" onClick={() => setEdit({ branch_code: '0000', payee_type: 'I' })}><Plus size={20} aria-hidden /> New Payee</Button>
      </PageHeader>
      <LoadError error={loadError} onRetry={reload} />
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <div className="fp-card">
        <Table responsive className={`mb-0 align-middle fp-stack ${loading && data ? 'fp-table-loading' : ''}`} aria-busy={loading}>
          <thead><tr><th>TIN</th><th>Name</th><th className="fp-hide-narrow">Type</th><th className="fp-hide-narrow">Status</th><th className="fp-actions"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            {loading && !data && <SkeletonRows cols={5} rows={5} hide={[2, 3]} />}
            {!loading && res.data.length === 0 && <tr><td colSpan={5} className="fp-empty">{q ? `No payees match "${q}".` : 'No payees yet.'}</td></tr>}
            {res.data.map((p) => (
              <tr key={p.id}>
                <td className="fp-tin">{p.tin}-{pad4(p.branch_code)}</td><td className="fp-name">{payeeName(p)}</td>
                <td className="fp-hide-narrow">{p.payee_type === 'I' ? 'Individual' : 'Non-individual'}</td><td className="fp-hide-narrow">{p.status_code}</td>
                <td className="fp-actions">
                  <Button size="sm" variant="light" onClick={() => setEdit(p)} aria-label={`Edit ${payeeName(p)}`} title="Edit"><PencilSquare aria-hidden /></Button>{' '}
                  <Button size="sm" variant="outline-danger" onClick={() => remove(p)} aria-label={`Archive ${payeeName(p)}`} title="Archive"><Trash aria-hidden /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pager pagination={res.pagination} onPage={setPage} noun="payees" />
      </div>
      {edit && <FormModal title={edit.id ? 'Edit payee' : 'New payee'} fields={payeeFields} initial={edit} onSave={save} onClose={() => setEdit(null)} idPrefix="payee" />}
    </>
  )
}

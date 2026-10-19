import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { customersApi, suppliersApi } from '../../lib/api/books'
import { errorMessage } from '../../lib/api/client'
import { confirmDialog } from '../../lib/confirm'
import { toast } from '../../lib/toast'
import { SkeletonRows } from '../Loading'
import Pager, { SearchBox } from '../Pager'

const KINDS = {
  supplier: { api: suppliersApi, title: 'Suppliers', sub: 'Manage vendor and supplier contacts. A supplier with a TIN can have tax withheld on its bills (QAP 1601-EQ / MAP).', noun: 'Supplier' },
  customer: { api: customersApi, title: 'Customers', sub: "Manage customers. A customer with a TIN can be recorded as withholding agent on its 2307s (SAWT).", noun: 'Customer' },
}
const BLANK = { name: '', payee_type: 'N', last_name: '', first_name: '', middle_name: '', tin: '', branch_code: '0000', email: '', phone: '', address: '', city: '', country: 'PH' }

// Suppliers and customers (alphalist-api /suppliers, /customers). Their TIN goes into the TIN library.
export default function PartnersPage({ kind }) {
  const { api, title, sub, noun } = KINDS[kind]
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null) // the record being added / edited
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // One page at a time (20), searched on the server by name, email or TIN.
  const load = useCallback(() => {
    setLoading(true)
    api.page({ page, search: query })
      .then(({ rows: r, pagination: p }) => { setRows(r); setPagination(p) })
      .catch((e) => setMsg({ variant: 'danger', text: errorMessage(e) }))
      .finally(() => setLoading(false))
  }, [api, page, query])
  useEffect(load, [load])
  const searchFor = (q) => { setQuery(q); setPage(1) }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const open = (row) => { setError(''); setForm(row ? { ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, row[k] ?? ''])), id: row.id } : { ...BLANK }) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const { message } = await api.save(form)
      setForm(null); toast(message || `${noun} saved.`); load()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  const handleDelete = async (row) => {
    if (!await confirmDialog(`Archive ${row.name}? Its documents stay.`, { ok: 'Archive', variant: 'danger' })) return
    try { await api.remove(row.id); toast(`${row.name} archived.`); load() } catch (e) { setMsg({ variant: 'danger', text: errorMessage(e) }) }
  }

  const individual = form?.payee_type === 'I'
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">{title}</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{sub}</p></div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => open(null)}><Plus size={18} /> New {noun}</Button>
      </div>
      {msg && <Alert variant={msg.variant} dismissible onClose={() => setMsg(null)}>{msg.text}</Alert>}
      <div className="card p-0 overflow-hidden">
        <div className="fp-list-tools">
          <SearchBox value={query} onSearch={searchFor} placeholder="Search name, email or TIN" label={`Search ${title.toLowerCase()}`} />
          {loading && rows.length > 0 && <Spinner size="sm" className="text-muted" aria-label="Loading" />}
        </div>
        <Table responsive hover className="mb-0 fp-stack">
          <thead><tr><th className="fp-hide-narrow">#</th><th>Name</th><th>TIN</th><th className="fp-hide-narrow">Email</th><th className="fp-hide-narrow">Phone</th><th>City</th><th className="fp-actions"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            {loading && rows.length === 0 && <SkeletonRows cols={7} hide={[0, 3, 4]} />}
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="fp-hide-narrow">{((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 0) + i + 1}</td>
                <td className="fw-semibold fp-name"><Users size={14} className="me-2 text-muted" aria-hidden />{r.name}{r.payee_type === 'I' && <Badge bg="light" text="dark" className="ms-2">individual</Badge>}</td>
                <td className="fp-tin">{r.formatted_tin || <span className="text-muted">no TIN</span>}</td>
                <td className="fp-hide-narrow">{r.email || '—'}</td>
                <td className="fp-hide-narrow text-nowrap">{r.phone || '—'}</td>
                <td>{r.city || '—'}</td>
                <td className="fp-actions"><Button variant="link" className="p-1" onClick={() => open(r)} aria-label={`Edit ${r.name}`} title="Edit"><Pencil size={16} aria-hidden /></Button><Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(r)} aria-label={`Archive ${r.name}`} title="Archive"><Trash2 size={16} aria-hidden /></Button></td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">{query ? `No ${title.toLowerCase()} match "${query}".` : `No ${title.toLowerCase()} yet.`}</td></tr>}
          </tbody>
        </Table>
        <Pager pagination={pagination} onPage={setPage} noun={title.toLowerCase()} />
      </div>
      <Modal show={!!form} onHide={() => setForm(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{form?.id ? `Edit ${noun}` : `New ${noun}`}</Modal.Title></Modal.Header>
        <Modal.Body>
          {form && (
            <Form onSubmit={handleSubmit}>
              {error && <Alert variant="danger">{error}</Alert>}
              <Row className="g-3">
                <Col md={8}><Form.Group controlId="partner-name"><Form.Label>Name</Form.Label><Form.Control required value={form.name} onChange={set('name')} /></Form.Group></Col>
                <Col md={4}><Form.Group controlId="partner-type"><Form.Label>Type</Form.Label><Form.Select value={form.payee_type} onChange={set('payee_type')}><option value="N">Company / non-individual</option><option value="I">Individual</option></Form.Select></Form.Group></Col>
                {individual && <>
                  <Col md={4}><Form.Group controlId="partner-last"><Form.Label>Last name</Form.Label><Form.Control required value={form.last_name} onChange={set('last_name')} /></Form.Group></Col>
                  <Col md={4}><Form.Group controlId="partner-first"><Form.Label>First name</Form.Label><Form.Control value={form.first_name} onChange={set('first_name')} /></Form.Group></Col>
                  <Col md={4}><Form.Group controlId="partner-middle"><Form.Label>Middle name</Form.Label><Form.Control value={form.middle_name} onChange={set('middle_name')} /></Form.Group></Col>
                </>}
                <Col md={8}><Form.Group controlId="partner-tin"><Form.Label>TIN</Form.Label><Form.Control placeholder="000-000-000" value={form.tin} onChange={set('tin')} /><Form.Text>Needed for tax withheld (BIR Alphalist).</Form.Text></Form.Group></Col>
                <Col md={4}><Form.Group controlId="partner-branch"><Form.Label>Branch</Form.Label><Form.Control value={form.branch_code} onChange={set('branch_code')} /></Form.Group></Col>
                <Col md={6}><Form.Group controlId="partner-email"><Form.Label>Email</Form.Label><Form.Control type="email" value={form.email} onChange={set('email')} /></Form.Group></Col>
                <Col md={6}><Form.Group controlId="partner-phone"><Form.Label>Phone</Form.Label><Form.Control value={form.phone} onChange={set('phone')} /></Form.Group></Col>
                <Col md={6}><Form.Group controlId="partner-city"><Form.Label>City</Form.Label><Form.Control value={form.city} onChange={set('city')} /></Form.Group></Col>
                <Col md={6}><Form.Group controlId="partner-country"><Form.Label>Country</Form.Label><Form.Control value={form.country} onChange={set('country')} /></Form.Group></Col>
                <Col md={12}><Form.Group controlId="partner-address"><Form.Label>Address</Form.Label><Form.Control as="textarea" rows={2} value={form.address} onChange={set('address')} /></Form.Group></Col>
              </Row>
              <div className="d-flex justify-content-end gap-2 mt-4"><Button variant="light" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" className="btn-accent" disabled={busy}>{busy && <Spinner size="sm" aria-hidden />} {form.id ? 'Update' : 'Create'}</Button></div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

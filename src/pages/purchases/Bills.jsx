import { useState } from 'react'
import { Modal, Button, Form, Table, Badge, Row, Col } from 'react-bootstrap'
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Bills = () => {
  const { rows: purchaseRows, create, update, remove } = useCollection('purchases', seeds.purchases)
  const { rows: allContacts } = useCollection('contacts', seeds.contacts)
  const contacts = allContacts.filter(c => c.type === 'supplier')
  const bills = purchaseRows
    .filter(b => b.po_number?.startsWith('BL'))
    .map(b => ({ ...b, contacts: allContacts.find(c => String(c.id) === String(b.contact_id)) }))
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ bill_number: '', contact_id: '', date: '', due_date: '', total_amount: '', status: 'draft', notes: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = form.bill_number.startsWith('BL') ? form.bill_number : `BL-${form.bill_number}`
    const payload = { ...form, total_amount: parseFloat(form.total_amount) || 0, po_number: num }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ bill_number: '', contact_id: '', date: '', due_date: '', total_amount: '', status: 'draft', notes: '' })
    }
  }

  const handleEdit = (b) => {
    setEditing(b)
    setForm({ bill_number: b.po_number, contact_id: b.contact_id, date: b.date, due_date: b.due_date || '', total_amount: b.total_amount, status: b.status, notes: b.notes || '' })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this bill?')) remove(id) }

  const statusBadge = (s) => {
    const variants = { draft: 'secondary', sent: 'info', received: 'primary', paid: 'success', overdue: 'danger' }
    return <Badge bg={variants[s] || 'secondary'}>{s}</Badge>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">Bills</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage supplier bills and payables.</p></div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ bill_number: '', contact_id: '', date: '', due_date: '', total_amount: '', status: 'draft', notes: '' }); setShowModal(true) }}><Plus size={18} /> New Bill</Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Bill #</th><th>Supplier</th><th>Date</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {bills.map((b, i) => (
              <tr key={b.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><Receipt size={14} className="me-2 text-muted" />{b.po_number}</td>
                <td>{b.contacts?.name || '—'}</td>
                <td>{b.date ? new Date(b.date).toLocaleDateString() : '—'}</td>
                <td>{b.due_date ? new Date(b.due_date).toLocaleDateString() : '—'}</td>
                <td className="fw-semibold">${parseFloat(b.total_amount || 0).toLocaleString()}</td>
                <td>{statusBadge(b.status)}</td>
                <td><Button variant="link" className="p-1" onClick={() => handleEdit(b)}><Pencil size={16} /></Button><Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(b.id)}><Trash2 size={16} /></Button></td>
              </tr>
            ))}
            {bills.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No bills found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Bill' : 'New Bill'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}><Form.Group><Form.Label>Bill Number</Form.Label><Form.Control required value={form.bill_number} onChange={e => setForm({ ...form, bill_number: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Supplier</Form.Label><Form.Select required value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })}><option value="">Select...</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Date</Form.Label><Form.Control type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Due Date</Form.Label><Form.Control type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Total Amount</Form.Label><Form.Control type="number" step="0.01" required value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>draft</option><option>sent</option><option>received</option><option>paid</option></Form.Select></Form.Group></Col>
              <Col md={12}><Form.Group><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Form.Group></Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4"><Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" className="btn-accent">{editing ? 'Update' : 'Create'}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}
export default Bills

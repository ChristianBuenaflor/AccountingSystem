import { useState } from 'react'
import { Modal, Button, Form, Table, Badge } from 'react-bootstrap'
import { Plus, Pencil, Trash2, ShoppingCart } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Purchases = () => {
  const { rows: purchaseRows, create, update, remove } = useCollection('purchases', seeds.purchases)
  const { rows: allContacts } = useCollection('contacts', seeds.contacts)
  const contacts = allContacts.filter(c => c.type === 'supplier')
  const orders = purchaseRows
    .filter(o => !o.po_number?.startsWith('BL'))
    .map(o => ({ ...o, contacts: allContacts.find(c => String(c.id) === String(o.contact_id)) }))
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ po_number: '', contact_id: '', date: '', total_amount: '', status: 'draft', notes: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, total_amount: parseFloat(form.total_amount) || 0 }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ po_number: '', contact_id: '', date: '', total_amount: '', status: 'draft', notes: '' })
    }
  }

  const handleEdit = (ord) => {
    setEditing(ord)
    setForm({ po_number: ord.po_number, contact_id: ord.contact_id, date: ord.date, total_amount: ord.total_amount, status: ord.status, notes: ord.notes || '' })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this purchase order?')) remove(id) }

  const statusBadge = (s) => {
    const variants = { draft: 'secondary', sent: 'info', received: 'primary', paid: 'success' }
    return <Badge bg={variants[s] || 'secondary'}>{s}</Badge>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Purchases</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage bills, purchase orders, and supplier transactions.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ po_number: '', contact_id: '', date: '', total_amount: '', status: 'draft', notes: '' }); setShowModal(true) }}>
          <Plus size={18} /> New Purchase Order
        </Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>PO Number</th><th>Supplier</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><ShoppingCart size={14} className="me-2 text-muted" />{o.po_number}</td>
                <td>{o.contacts?.name || '—'}</td>
                <td>{o.date ? new Date(o.date).toLocaleDateString() : '—'}</td>
                <td className="fw-semibold">${parseFloat(o.total_amount || 0).toLocaleString()}</td>
                <td>{statusBadge(o.status)}</td>
                <td>
                  <Button variant="link" className="p-1" onClick={() => handleEdit(o)}><Pencil size={16} /></Button>
                  <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(o.id)}><Trash2 size={16} /></Button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">No purchase orders found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Purchase Order' : 'New Purchase Order'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6"><Form.Group><Form.Label>PO Number</Form.Label><Form.Control required value={form.po_number} onChange={e => setForm({ ...form, po_number: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Supplier</Form.Label><Form.Select required value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })}><option value="">Select...</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Form.Select></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Date</Form.Label><Form.Control type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Total Amount</Form.Label><Form.Control type="number" step="0.01" required value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>draft</option><option>sent</option><option>received</option><option>paid</option></Form.Select></Form.Group></div>
              <div className="col-12"><Form.Group><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Form.Group></div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="btn-accent">{editing ? 'Update' : 'Create'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Purchases

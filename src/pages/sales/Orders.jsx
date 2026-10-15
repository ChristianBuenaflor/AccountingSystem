import { useState } from 'react'
import { Modal, Button, Form, Table, Badge, Row, Col } from 'react-bootstrap'
import { Plus, Pencil, Trash2, ShoppingBag } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Orders = () => {
  const { rows: salesRows, create, update, remove } = useCollection('sales', seeds.sales)
  const { rows: allContacts } = useCollection('contacts', seeds.contacts)
  const contacts = allContacts.filter(c => c.type === 'customer')
  const orders = salesRows
    .filter(s => s.invoice_number?.startsWith('SO'))
    .map(o => ({ ...o, contacts: allContacts.find(c => String(c.id) === String(o.contact_id)) }))
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ order_number: '', contact_id: '', date: '', delivery_date: '', total_amount: '', status: 'pending', notes: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = form.order_number.startsWith('SO') ? form.order_number : `SO-${form.order_number}`
    const payload = { ...form, total_amount: parseFloat(form.total_amount) || 0, invoice_number: num, due_date: form.delivery_date }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ order_number: '', contact_id: '', date: '', delivery_date: '', total_amount: '', status: 'pending', notes: '' })
    }
  }

  const handleEdit = (o) => {
    setEditing(o)
    setForm({ order_number: o.invoice_number, contact_id: o.contact_id, date: o.date, delivery_date: o.due_date, total_amount: o.total_amount, status: o.status, notes: o.notes || '' })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this order?')) remove(id) }

  const statusBadge = (s) => {
    const variants = { pending: 'warning', confirmed: 'info', shipped: 'primary', delivered: 'success', cancelled: 'danger' }
    return <Badge bg={variants[s] || 'secondary'} text={s === 'pending' ? 'dark' : undefined}>{s}</Badge>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">Sales Orders</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage sales orders and fulfillment.</p></div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ order_number: '', contact_id: '', date: '', delivery_date: '', total_amount: '', status: 'pending', notes: '' }); setShowModal(true) }}><Plus size={18} /> New Order</Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Order #</th><th>Customer</th><th>Date</th><th>Delivery</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><ShoppingBag size={14} className="me-2 text-muted" />{o.invoice_number}</td>
                <td>{o.contacts?.name || '—'}</td>
                <td>{o.date ? new Date(o.date).toLocaleDateString() : '—'}</td>
                <td>{o.due_date ? new Date(o.due_date).toLocaleDateString() : '—'}</td>
                <td className="fw-semibold">${parseFloat(o.total_amount || 0).toLocaleString()}</td>
                <td>{statusBadge(o.status)}</td>
                <td><Button variant="link" className="p-1" onClick={() => handleEdit(o)}><Pencil size={16} /></Button><Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(o.id)}><Trash2 size={16} /></Button></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No sales orders found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Order' : 'New Sales Order'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}><Form.Group><Form.Label>Order Number</Form.Label><Form.Control required value={form.order_number} onChange={e => setForm({ ...form, order_number: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Customer</Form.Label><Form.Select required value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })}><option value="">Select...</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Date</Form.Label><Form.Control type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Delivery Date</Form.Label><Form.Control type="date" required value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Total Amount</Form.Label><Form.Control type="number" step="0.01" required value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>pending</option><option>confirmed</option><option>shipped</option><option>delivered</option><option>cancelled</option></Form.Select></Form.Group></Col>
              <Col md={12}><Form.Group><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Form.Group></Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4"><Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" className="btn-accent">{editing ? 'Update' : 'Create'}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}
export default Orders

import { useState } from 'react'
import { Modal, Button, Form, Table, Badge, Row, Col } from 'react-bootstrap'
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const margin = (s) => {
  const price = parseFloat(s.price) || 0
  if (price <= 0) return '—'
  return `${(((price - (parseFloat(s.cost) || 0)) / price) * 100).toFixed(0)}%`
}

const Services = () => {
  const { rows: productRows, create, update, remove } = useCollection('products', seeds.products)
  const services = productRows.filter(p => p.category === 'Service')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', sku: '', description: '', price: '', cost: '', category: 'Service' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, price: parseFloat(form.price) || 0, cost: parseFloat(form.cost) || 0, stock_quantity: 999, category: 'Service' }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ name: '', sku: '', description: '', price: '', cost: '', category: 'Service' })
    }
  }

  const handleEdit = (s) => {
    setEditing(s)
    setForm({ name: s.name, sku: s.sku, description: s.description || '', price: s.price, cost: s.cost, category: 'Service' })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this service?')) remove(id) }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">Services</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage service offerings and billable items.</p></div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ name: '', sku: '', description: '', price: '', cost: '', category: 'Service' }); setShowModal(true) }}><Plus size={18} /> New Service</Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Name</th><th>SKU</th><th>Price</th><th>Cost</th><th>Margin</th><th>Actions</th></tr></thead>
          <tbody>
            {services.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><Wrench size={14} className="me-2 text-muted" />{s.name}</td>
                <td><Badge bg="light" text="dark" className="border">{s.sku}</Badge></td>
                <td className="fw-semibold text-success">₱{parseFloat(s.price || 0).toLocaleString()}</td>
                <td>₱{parseFloat(s.cost || 0).toLocaleString()}</td>
                <td><Badge bg="info">{margin(s)}</Badge></td>
                <td><Button variant="link" className="p-1" onClick={() => handleEdit(s)}><Pencil size={16} /></Button><Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></Button></td>
              </tr>
            ))}
            {services.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">No services found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Service' : 'New Service'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}><Form.Group><Form.Label>Name</Form.Label><Form.Control required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>SKU</Form.Label><Form.Control required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Price</Form.Label><Form.Control type="number" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Cost</Form.Label><Form.Control type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></Form.Group></Col>
              <Col md={12}><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Form.Group></Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4"><Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" className="btn-accent">{editing ? 'Update' : 'Create'}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}
export default Services

import { useState } from 'react'
import { Modal, Button, Form, Table, Badge, Row, Col } from 'react-bootstrap'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Suppliers = () => {
  const { rows: contactRows, create, update, remove } = useCollection('contacts', seeds.contacts)
  const suppliers = contactRows.filter(c => c.type === 'supplier')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', country: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, type: 'supplier' }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ name: '', email: '', phone: '', address: '', city: '', country: '' })
    }
  }

  const handleEdit = (s) => {
    setEditing(s)
    setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '', city: s.city || '', country: s.country || '' })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this supplier?')) remove(id) }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">Suppliers</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage vendor and supplier contacts.</p></div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '', city: '', country: '' }); setShowModal(true) }}><Plus size={18} /> New Supplier</Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Country</th><th>Actions</th></tr></thead>
          <tbody>
            {suppliers.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><Users size={14} className="me-2 text-muted" />{s.name}</td>
                <td>{s.email || '—'}</td>
                <td>{s.phone || '—'}</td>
                <td>{s.city || '—'}</td>
                <td>{s.country || '—'}</td>
                <td><Button variant="link" className="p-1" onClick={() => handleEdit(s)}><Pencil size={16} /></Button><Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></Button></td>
              </tr>
            ))}
            {suppliers.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">No suppliers found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Supplier' : 'New Supplier'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}><Form.Group><Form.Label>Name</Form.Label><Form.Control required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Email</Form.Label><Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Phone</Form.Label><Form.Control value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>City</Form.Label><Form.Control value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Country</Form.Label><Form.Control value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></Form.Group></Col>
              <Col md={12}><Form.Group><Form.Label>Address</Form.Label><Form.Control as="textarea" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Form.Group></Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4"><Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" className="btn-accent">{editing ? 'Update' : 'Create'}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}
export default Suppliers

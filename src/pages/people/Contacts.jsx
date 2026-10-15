import { useState } from 'react'
import { Modal, Button, Form, Table, Badge } from 'react-bootstrap'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Contacts = () => {
  const { rows: contacts, create, update, remove } = useCollection('contacts', seeds.contacts)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', type: 'customer', address: '', city: '', country: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) {
      update(editing.id, form); setShowModal(false); setEditing(null)
    } else {
      create(form); setShowModal(false); setForm({ name: '', email: '', phone: '', type: 'customer', address: '', city: '', country: '' })
    }
  }

  const handleEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', type: c.type, address: c.address || '', city: c.city || '', country: c.country || '' })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this contact?')) remove(id) }

  const typeBadge = (t) => {
    const colors = { customer: 'primary', supplier: 'info', employee: 'secondary' }
    return <Badge bg={colors[t] || 'light'} text={colors[t] ? undefined : 'dark'} className={!colors[t] ? 'border' : ''}>{t}</Badge>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Contacts</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage customers, suppliers, and other contacts.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', type: 'customer', address: '', city: '', country: '' }); setShowModal(true) }}>
          <Plus size={18} /> New Contact
        </Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Name</th><th>Type</th><th>Email</th><th>Phone</th><th>City</th><th>Country</th><th>Actions</th></tr></thead>
          <tbody>
            {contacts.map((c, i) => (
              <tr key={c.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><Users size={14} className="me-2 text-muted" />{c.name}</td>
                <td>{typeBadge(c.type)}</td>
                <td>{c.email || '—'}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.city || '—'}</td>
                <td>{c.country || '—'}</td>
                <td>
                  <Button variant="link" className="p-1" onClick={() => handleEdit(c)}><Pencil size={16} /></Button>
                  <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></Button>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No contacts found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Contact' : 'New Contact'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6"><Form.Group><Form.Label>Name</Form.Label><Form.Control required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Type</Form.Label><Form.Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>customer</option><option>supplier</option><option>employee</option></Form.Select></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Email</Form.Label><Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Phone</Form.Label><Form.Control value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Form.Group></div>
              <div className="col-12"><Form.Group><Form.Label>Address</Form.Label><Form.Control value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>City</Form.Label><Form.Control value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Country</Form.Label><Form.Control value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></Form.Group></div>
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

export default Contacts

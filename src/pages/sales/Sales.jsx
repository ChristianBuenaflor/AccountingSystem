import { useState } from 'react'
import { Modal, Button, Form, Table, Badge } from 'react-bootstrap'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Sales = () => {
  const { rows: salesRows, create, update, remove } = useCollection('sales', seeds.sales)
  const { rows: allContacts } = useCollection('contacts', seeds.contacts)
  const contacts = allContacts.filter(c => c.type === 'customer')
  const invoices = salesRows
    .filter(r => !r.invoice_number?.startsWith('QT') && !r.invoice_number?.startsWith('SO'))
    .map(inv => ({ ...inv, contacts: allContacts.find(c => String(c.id) === String(inv.contact_id)) }))
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ invoice_number: '', contact_id: '', date: '', due_date: '', total_amount: '', status: 'draft', notes: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, total_amount: parseFloat(form.total_amount) || 0 }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ invoice_number: '', contact_id: '', date: '', due_date: '', total_amount: '', status: 'draft', notes: '' })
    }
  }

  const handleEdit = (inv) => {
    setEditing(inv)
    setForm({
      invoice_number: inv.invoice_number,
      contact_id: inv.contact_id,
      date: inv.date,
      due_date: inv.due_date,
      total_amount: inv.total_amount,
      status: inv.status,
      notes: inv.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this invoice?')) remove(id)
  }

  const statusBadge = (s) => {
    const variants = { draft: 'secondary', sent: 'info', paid: 'success', overdue: 'danger' }
    return <Badge bg={variants[s] || 'secondary'}>{s}</Badge>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Sales</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage invoices, quotes, and sales orders.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ invoice_number: '', contact_id: '', date: '', due_date: '', total_amount: '', status: 'draft', notes: '' }); setShowModal(true) }}>
          <Plus size={18} /> New Invoice
        </Button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Invoice #</th><th>Customer</th><th>Date</th><th>Due Date</th><th>Amount</th><th>Status</th><th style={{ width: 120 }}>Actions</th></tr></thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={inv.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><FileText size={14} className="me-2 text-muted" />{inv.invoice_number}</td>
                <td>{inv.contacts?.name || '—'}</td>
                <td>{inv.date ? new Date(inv.date).toLocaleDateString() : '—'}</td>
                <td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                <td className="fw-semibold">${parseFloat(inv.total_amount || 0).toLocaleString()}</td>
                <td>{statusBadge(inv.status)}</td>
                <td>
                  <Button variant="link" className="p-1" onClick={() => handleEdit(inv)}><Pencil size={16} /></Button>
                  <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(inv.id)}><Trash2 size={16} /></Button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No invoices found.</td></tr>}
          </tbody>
        </Table>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Invoice' : 'New Invoice'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6"><Form.Group><Form.Label>Invoice Number</Form.Label><Form.Control required value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Customer</Form.Label><Form.Select required value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })}><option value="">Select...</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Form.Select></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Date</Form.Label><Form.Control type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Due Date</Form.Label><Form.Control type="date" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Total Amount</Form.Label><Form.Control type="number" step="0.01" required value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>draft</option><option>sent</option><option>paid</option><option>overdue</option></Form.Select></Form.Group></div>
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

export default Sales

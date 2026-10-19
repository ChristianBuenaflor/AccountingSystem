import { useState } from 'react'
import { Modal, Button, Form, Table, Badge } from 'react-bootstrap'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Journals = () => {
  const { rows: entries, create, update, remove } = useCollection('journals', seeds.journals)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ entry_number: '', date: '', description: '', total_debit: '', total_credit: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, total_debit: parseFloat(form.total_debit) || 0, total_credit: parseFloat(form.total_credit) || 0 }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ entry_number: '', date: '', description: '', total_debit: '', total_credit: '' })
    }
  }

  const handleEdit = (entry) => {
    setEditing(entry)
    setForm({ entry_number: entry.entry_number, date: entry.date, description: entry.description || '', total_debit: entry.total_debit, total_credit: entry.total_credit })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this journal entry?')) remove(id) }

  const statusBadge = (debit, credit) => {
    const diff = Math.abs(parseFloat(debit) - parseFloat(credit))
    return diff < 0.01 ? <Badge bg="success">Balanced</Badge> : <Badge bg="warning" text="dark">Unbalanced</Badge>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Journals</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Record and manage accounting journal entries.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ entry_number: '', date: '', description: '', total_debit: '', total_credit: '' }); setShowModal(true) }}>
          <Plus size={18} /> New Journal Entry
        </Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Entry #</th><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><BookOpen size={14} className="me-2 text-muted" />{e.entry_number}</td>
                <td>{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                <td>{e.description || '—'}</td>
                <td className="fw-semibold text-success">₱{parseFloat(e.total_debit || 0).toLocaleString()}</td>
                <td className="fw-semibold text-danger">₱{parseFloat(e.total_credit || 0).toLocaleString()}</td>
                <td>{statusBadge(e.total_debit, e.total_credit)}</td>
                <td>
                  <Button variant="link" className="p-1" onClick={() => handleEdit(e)}><Pencil size={16} /></Button>
                  <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(e.id)}><Trash2 size={16} /></Button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No journal entries found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Journal Entry' : 'New Journal Entry'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6"><Form.Group><Form.Label>Entry Number</Form.Label><Form.Control required value={form.entry_number} onChange={e => setForm({ ...form, entry_number: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Date</Form.Label><Form.Control type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Total Debit</Form.Label><Form.Control type="number" step="0.01" required value={form.total_debit} onChange={e => setForm({ ...form, total_debit: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Total Credit</Form.Label><Form.Control type="number" step="0.01" required value={form.total_credit} onChange={e => setForm({ ...form, total_credit: e.target.value })} /></Form.Group></div>
              <div className="col-12"><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Form.Group></div>
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

export default Journals

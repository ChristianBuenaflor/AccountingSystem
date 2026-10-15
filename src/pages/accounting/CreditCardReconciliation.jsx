import { useState } from 'react'
import { Modal, Button, Form, Table, Badge, Row, Col } from 'react-bootstrap'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const CreditCardReconciliation = () => {
  const { rows: reconRows, create, update, remove } = useCollection('reconciliations', seeds.reconciliations)
  const items = reconRows
    .filter(r => r.account_name?.toLowerCase().includes('card') || r.account_name?.toLowerCase().includes('credit'))
    .map((r) => ({ ...r, difference: (parseFloat(r.statement_balance) || 0) - (parseFloat(r.book_balance) || 0) }))
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ account_name: '', statement_date: '', statement_balance: '', book_balance: '', status: 'pending' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const name = /card|credit/i.test(form.account_name) ? form.account_name : `Credit Card - ${form.account_name}`
    const payload = { ...form, account_name: name, statement_balance: parseFloat(form.statement_balance) || 0, book_balance: parseFloat(form.book_balance) || 0 }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ account_name: '', statement_date: '', statement_balance: '', book_balance: '', status: 'pending' })
    }
  }

  const handleEdit = (item) => {
    setEditing(item)
    setForm({ account_name: item.account_name, statement_date: item.statement_date, statement_balance: item.statement_balance, book_balance: item.book_balance, status: item.status })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this reconciliation?')) remove(id) }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">Credit Card Reconciliation</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Reconcile credit card statements.</p></div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ account_name: '', statement_date: '', statement_balance: '', book_balance: '', status: 'pending' }); setShowModal(true) }}><Plus size={18} /> New Reconciliation</Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Account</th><th>Statement Date</th><th>Statement Balance</th><th>Book Balance</th><th>Difference</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><CreditCard size={14} className="me-2 text-muted" />{r.account_name}</td>
                <td>{r.statement_date ? new Date(r.statement_date).toLocaleDateString() : '—'}</td>
                <td className="fw-semibold">${parseFloat(r.statement_balance || 0).toLocaleString()}</td>
                <td className="fw-semibold">${parseFloat(r.book_balance || 0).toLocaleString()}</td>
                <td className={Math.abs(parseFloat(r.difference)) < 0.01 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>${parseFloat(r.difference || 0).toLocaleString()}</td>
                <td><Badge bg={r.status === 'reconciled' ? 'success' : 'warning'} text={r.status === 'reconciled' ? undefined : 'dark'}>{r.status}</Badge></td>
                <td><Button variant="link" className="p-1" onClick={() => handleEdit(r)}><Pencil size={16} /></Button><Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(r.id)}><Trash2 size={16} /></Button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No credit card reconciliations found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Reconciliation' : 'New Credit Card Reconciliation'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}><Form.Group><Form.Label>Account Name</Form.Label><Form.Control required placeholder="e.g. Credit Card - Visa" value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Statement Date</Form.Label><Form.Control type="date" required value={form.statement_date} onChange={e => setForm({ ...form, statement_date: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Statement Balance</Form.Label><Form.Control type="number" step="0.01" required value={form.statement_balance} onChange={e => setForm({ ...form, statement_balance: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Book Balance</Form.Label><Form.Control type="number" step="0.01" required value={form.book_balance} onChange={e => setForm({ ...form, book_balance: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>pending</option><option>reconciled</option></Form.Select></Form.Group></Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4"><Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" className="btn-accent">{editing ? 'Update' : 'Create'}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}
export default CreditCardReconciliation

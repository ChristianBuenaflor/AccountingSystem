import { useState } from 'react'
import { Modal, Button, Form, Table, Badge } from 'react-bootstrap'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const FixedAssets = () => {
  const { rows: assets, create, update, remove } = useCollection('assets', seeds.assets)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', asset_code: '', purchase_date: '', purchase_cost: '', current_value: '', depreciation_method: 'Straight Line', useful_life: '', status: 'active' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, purchase_cost: parseFloat(form.purchase_cost) || 0, current_value: parseFloat(form.current_value) || 0, useful_life: parseInt(form.useful_life) || 0 }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ name: '', asset_code: '', purchase_date: '', purchase_cost: '', current_value: '', depreciation_method: 'Straight Line', useful_life: '', status: 'active' })
    }
  }

  const handleEdit = (a) => {
    setEditing(a)
    setForm({ name: a.name, asset_code: a.asset_code, purchase_date: a.purchase_date, purchase_cost: a.purchase_cost, current_value: a.current_value, depreciation_method: a.depreciation_method, useful_life: a.useful_life, status: a.status })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this asset?')) remove(id) }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Fixed Assets</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Track company assets, depreciation, and valuations.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ name: '', asset_code: '', purchase_date: '', purchase_cost: '', current_value: '', depreciation_method: 'Straight Line', useful_life: '', status: 'active' }); setShowModal(true) }}>
          <Plus size={18} /> New Asset
        </Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Asset</th><th>Code</th><th>Purchase Date</th><th>Cost</th><th>Current Value</th><th>Depreciation</th><th>Life</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {assets.map((a, i) => (
              <tr key={a.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><Package size={14} className="me-2 text-muted" />{a.name}</td>
                <td>{a.asset_code}</td>
                <td>{a.purchase_date ? new Date(a.purchase_date).toLocaleDateString() : '—'}</td>
                <td>${parseFloat(a.purchase_cost || 0).toLocaleString()}</td>
                <td>${parseFloat(a.current_value || 0).toLocaleString()}</td>
                <td>{a.depreciation_method}</td>
                <td>{a.useful_life} yrs</td>
                <td><Badge bg={a.status === 'active' ? 'success' : a.status === 'sold' ? 'info' : 'secondary'}>{a.status}</Badge></td>
                <td>
                  <Button variant="link" className="p-1" onClick={() => handleEdit(a)}><Pencil size={16} /></Button>
                  <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(a.id)}><Trash2 size={16} /></Button>
                </td>
              </tr>
            ))}
            {assets.length === 0 && <tr><td colSpan={10} className="text-center text-muted py-4">No fixed assets found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Asset' : 'New Asset'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6"><Form.Group><Form.Label>Asset Name</Form.Label><Form.Control required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Asset Code</Form.Label><Form.Control required value={form.asset_code} onChange={e => setForm({ ...form, asset_code: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Purchase Date</Form.Label><Form.Control type="date" required value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Purchase Cost</Form.Label><Form.Control type="number" step="0.01" required value={form.purchase_cost} onChange={e => setForm({ ...form, purchase_cost: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Current Value</Form.Label><Form.Control type="number" step="0.01" required value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Depreciation Method</Form.Label><Form.Select value={form.depreciation_method} onChange={e => setForm({ ...form, depreciation_method: e.target.value })}><option>Straight Line</option><option>Declining Balance</option><option>Units of Production</option></Form.Select></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Useful Life (years)</Form.Label><Form.Control type="number" required value={form.useful_life} onChange={e => setForm({ ...form, useful_life: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>active</option><option>disposed</option><option>sold</option></Form.Select></Form.Group></div>
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

export default FixedAssets

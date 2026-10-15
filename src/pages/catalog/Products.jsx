import { useState } from 'react'
import { Modal, Button, Form, Table, Badge } from 'react-bootstrap'
import { Plus, Pencil, Trash2, Boxes } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Products = () => {
  const { rows: products, create, update, remove } = useCollection('products', seeds.products)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', sku: '', description: '', price: '', cost: '', stock_quantity: '', category: 'Item' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, price: parseFloat(form.price) || 0, cost: parseFloat(form.cost) || 0, stock_quantity: parseInt(form.stock_quantity) || 0 }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ name: '', sku: '', description: '', price: '', cost: '', stock_quantity: '', category: 'Item' })
    }
  }

  const handleEdit = (p) => {
    setEditing(p)
    setForm({ name: p.name, sku: p.sku, description: p.description || '', price: p.price, cost: p.cost, stock_quantity: p.stock_quantity, category: p.category || 'Item' })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this product?')) remove(id) }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Products</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage items and services catalog.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ name: '', sku: '', description: '', price: '', cost: '', stock_quantity: '', category: 'Item' }); setShowModal(true) }}>
          <Plus size={18} /> New Product
        </Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Cost</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><Boxes size={14} className="me-2 text-muted" />{p.name}</td>
                <td><Badge bg="light" text="dark" className="border">{p.sku}</Badge></td>
                <td>{p.category}</td>
                <td className="fw-semibold text-success">${parseFloat(p.price || 0).toLocaleString()}</td>
                <td>${parseFloat(p.cost || 0).toLocaleString()}</td>
                <td><Badge bg={(p.stock_quantity ?? 0) > 10 ? 'success' : (p.stock_quantity ?? 0) > 0 ? 'warning' : 'danger'}>{p.stock_quantity ?? 0}</Badge></td>
                <td>
                  <Button variant="link" className="p-1" onClick={() => handleEdit(p)}><Pencil size={16} /></Button>
                  <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></Button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No products found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Product' : 'New Product'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6"><Form.Group><Form.Label>Name</Form.Label><Form.Control required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>SKU</Form.Label><Form.Control required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Category</Form.Label><Form.Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>Item</option><option>Service</option></Form.Select></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Stock Quantity</Form.Label><Form.Control type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Price</Form.Label><Form.Control type="number" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Cost</Form.Label><Form.Control type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></Form.Group></div>
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

export default Products

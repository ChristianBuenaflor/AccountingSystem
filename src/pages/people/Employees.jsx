import { useState } from 'react'
import { Modal, Button, Form, Table, Badge } from 'react-bootstrap'
import { Plus, Pencil, Trash2, UserCircle } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Employees = () => {
  const { rows: employees, create, update, remove } = useCollection('employees', seeds.employees)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', department: '', position: '', hire_date: '', salary: '', status: 'active' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, salary: parseFloat(form.salary) || 0 }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ first_name: '', last_name: '', email: '', phone: '', department: '', position: '', hire_date: '', salary: '', status: 'active' })
    }
  }

  const handleEdit = (emp) => {
    setEditing(emp)
    setForm({ first_name: emp.first_name, last_name: emp.last_name, email: emp.email || '', phone: emp.phone || '', department: emp.department || '', position: emp.position || '', hire_date: emp.hire_date, salary: emp.salary, status: emp.status })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this employee?')) remove(id) }

  const statusBadge = (s) => {
    const colors = { active: 'success', terminated: 'danger', on_leave: 'warning' }
    return <Badge bg={colors[s] || 'secondary'}>{String(s || '').replace('_', ' ')}</Badge>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Employees</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage staff, departments, and payroll.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ first_name: '', last_name: '', email: '', phone: '', department: '', position: '', hire_date: '', salary: '', status: 'active' }); setShowModal(true) }}>
          <Plus size={18} /> New Employee
        </Button>
      </div>
      <div className="card p-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead><tr><th>#</th><th>Name</th><th>Department</th><th>Position</th><th>Email</th><th>Hire Date</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {employees.map((e, i) => (
              <tr key={e.id}>
                <td>{i + 1}</td>
                <td className="fw-semibold"><UserCircle size={14} className="me-2 text-muted" />{e.first_name} {e.last_name}</td>
                <td>{e.department || '—'}</td>
                <td>{e.position || '—'}</td>
                <td>{e.email || '—'}</td>
                <td>{e.hire_date ? new Date(e.hire_date).toLocaleDateString() : '—'}</td>
                <td className="fw-semibold">${parseFloat(e.salary || 0).toLocaleString()}</td>
                <td>{statusBadge(e.status)}</td>
                <td>
                  <Button variant="link" className="p-1" onClick={() => handleEdit(e)}><Pencil size={16} /></Button>
                  <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(e.id)}><Trash2 size={16} /></Button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && <tr><td colSpan={9} className="text-center text-muted py-4">No employees found.</td></tr>}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Employee' : 'New Employee'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6"><Form.Group><Form.Label>First Name</Form.Label><Form.Control required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Last Name</Form.Label><Form.Control required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Email</Form.Label><Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Phone</Form.Label><Form.Control value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Department</Form.Label><Form.Control value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Position</Form.Label><Form.Control value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Hire Date</Form.Label><Form.Control type="date" required value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Salary</Form.Label><Form.Control type="number" step="0.01" required value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>active</option><option>terminated</option><option>on_leave</option></Form.Select></Form.Group></div>
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

export default Employees

import { useState } from 'react'
import { Modal, Button, Form, Badge, Row, Col } from 'react-bootstrap'
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Calendar as CalendarIcon } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'
import { toDateInput } from '../../lib/store/dates.js'

const Tasks = () => {
  const { rows: eventRows, create, update, remove } = useCollection('events', seeds.events)
  const tasks = eventRows
    .filter(e => e.title?.toLowerCase().includes('task') || e.description?.toLowerCase().includes('task'))
    .map(e => ({ ...e, priority: e.priority || 'medium', status: e.status || 'todo' }))
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: 'medium', status: 'todo', color: '#3498db' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, start_time: form.due_date ? new Date(form.due_date).toISOString() : new Date().toISOString() }
    if (editing) {
      update(editing.id, payload); setShowModal(false); setEditing(null)
    } else {
      create(payload); setShowModal(false); setForm({ title: '', description: '', due_date: '', priority: 'medium', status: 'todo', color: '#3498db' })
    }
  }

  const toggleStatus = (task) => {
    update(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
  }

  const handleEdit = (t) => {
    setEditing(t)
    setForm({ title: t.title, description: t.description || '', due_date: toDateInput(t.start_time), priority: t.priority || 'medium', status: t.status || 'todo', color: t.color || '#3498db' })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this task?')) remove(id) }

  const priorityBadge = (p) => {
    const colors = { low: 'secondary', medium: 'warning', high: 'danger' }
    return <Badge bg={colors[p] || 'secondary'} text={p === 'medium' ? 'dark' : undefined}>{p}</Badge>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">Tasks</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage to-do items and action items.</p></div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ title: '', description: '', due_date: '', priority: 'medium', status: 'todo', color: '#3498db' }); setShowModal(true) }}><Plus size={18} /> New Task</Button>
      </div>
      <div className="card border-0 shadow-sm p-0">
        {tasks.length === 0 && <div className="text-center text-muted py-5">No tasks found.</div>}
        {tasks.map(t => (
          <div key={t.id} className="d-flex align-items-center gap-3 p-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <button className="btn btn-link p-0" onClick={() => toggleStatus(t)}>{t.status === 'done' ? <CheckCircle2 size={20} color="#00b894" /> : <Circle size={20} color="#cbd5e1" />}</button>
            <div className="flex-grow-1">
              <div className={`fw-semibold ${t.status === 'done' ? 'text-decoration-line-through text-muted' : ''}`} style={{ fontSize: '0.9rem' }}>{t.title}</div>
              {t.description && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{t.description}</div>}
              <div className="d-flex align-items-center gap-2 mt-1">
                <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}><CalendarIcon size={12} /> {t.start_time ? new Date(t.start_time).toLocaleDateString() : '—'}</span>
                {priorityBadge(t.priority || 'medium')}
              </div>
            </div>
            <Button variant="link" className="p-1" onClick={() => handleEdit(t)}><Pencil size={14} /></Button>
            <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></Button>
          </div>
        ))}
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Task' : 'New Task'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={12}><Form.Group><Form.Label>Title</Form.Label><Form.Control required placeholder="e.g. Task: follow up invoice" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Due Date</Form.Label><Form.Control type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Priority</Form.Label><Form.Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>low</option><option>medium</option><option>high</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Color</Form.Label><Form.Control type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></Form.Group></Col>
              <Col md={12}><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Form.Group></Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-4"><Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" className="btn-accent">{editing ? 'Update' : 'Create'}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}
export default Tasks

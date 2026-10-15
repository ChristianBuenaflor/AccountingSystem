import { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { Plus, Calendar, Clock, Pencil, Trash2 } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'
import { toDateInput } from '../../lib/store/dates.js'

const Scheduler = () => {
  const { rows: events, create, update, remove } = useCollection('events', seeds.events)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', start_time: '', end_time: '', all_day: false, color: '#00b894' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) {
      update(editing.id, form); setShowModal(false); setEditing(null)
    } else {
      create(form); setShowModal(false); setForm({ title: '', description: '', start_time: '', end_time: '', all_day: false, color: '#00b894' })
    }
  }

  const handleEdit = (ev) => {
    setEditing(ev)
    setForm({ title: ev.title, description: ev.description || '', start_time: toDateInput(ev.start_time, 16), end_time: toDateInput(ev.end_time, 16), all_day: ev.all_day, color: ev.color || '#00b894' })
    setShowModal(true)
  }

  const handleDelete = (id) => { if (confirm('Delete this event?')) remove(id) }

  const today = new Date().toISOString().slice(0, 10)
  const safeTime = (t) => { const d = new Date(t); return isNaN(d) ? null : d }
  const upcoming = events.filter(e => { const d = safeTime(e.start_time); return d && d >= new Date(today) }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const past = events.filter(e => { const d = safeTime(e.start_time); return !d || d < new Date(today) }).sort((a, b) => new Date(b.start_time) - new Date(a.start_time))

  const EventCard = ({ ev }) => (
    <div className="d-flex gap-3 p-3 mb-2 rounded" style={{ background: '#fff', borderLeft: `4px solid ${ev.color || '#00b894'}` }}>
      <div className="text-center" style={{ minWidth: 50 }}>
        <div className="fw-bold" style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'uppercase' }}>{safeTime(ev.start_time)?.toLocaleDateString('en-US', { month: 'short' }) || '—'}</div>
        <div className="fw-bold fs-4">{safeTime(ev.start_time)?.getDate() || '—'}</div>
      </div>
      <div className="flex-grow-1">
        <div className="fw-semibold">{ev.title}</div>
        <div className="text-muted d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
          <Clock size={12} /> {ev.all_day ? 'All day' : `${safeTime(ev.start_time)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '—'} - ${safeTime(ev.end_time)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '—'}`}
        </div>
        {ev.description && <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>{ev.description}</div>}
      </div>
      <div className="d-flex gap-1">
        <Button variant="link" className="p-1" onClick={() => handleEdit(ev)}><Pencil size={14} /></Button>
        <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(ev.id)}><Trash2 size={14} /></Button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Scheduler</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Calendar, tasks, and events.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setEditing(null); setForm({ title: '', description: '', start_time: '', end_time: '', all_day: false, color: '#00b894' }); setShowModal(true) }}>
          <Plus size={18} /> New Event
        </Button>
      </div>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card p-4 border-0 shadow-sm">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><Calendar size={16} /> Upcoming Events</h6>
            {upcoming.length ? upcoming.map(ev => <EventCard key={ev.id} ev={ev} />) : <p className="text-muted">No upcoming events.</p>}
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card p-4 border-0 shadow-sm">
            <h6 className="fw-bold mb-3">Past Events</h6>
            {past.slice(0, 6).map(ev => (
              <div key={ev.id} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.85rem' }}>{ev.title}</span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{safeTime(ev.start_time)?.toLocaleDateString() || '—'}</span>
              </div>
            ))}
            {past.length === 0 && <p className="text-muted">No past events.</p>}
          </div>
        </div>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{editing ? 'Edit Event' : 'New Event'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12"><Form.Group><Form.Label>Title</Form.Label><Form.Control required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Start Time</Form.Label><Form.Control type="datetime-local" required value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>End Time</Form.Label><Form.Control type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Check type="checkbox" label="All Day" checked={form.all_day} onChange={e => setForm({ ...form, all_day: e.target.checked })} /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Color</Form.Label><Form.Control type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></Form.Group></div>
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

export default Scheduler

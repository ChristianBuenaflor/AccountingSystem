import { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { Mail, Star, Trash2, Send, Inbox, FileText, RotateCcw } from 'lucide-react'
import { useCollection } from '../../lib/store/useCollection.js'
import { seeds } from '../../lib/store/db.js'

const Mailbox = () => {
  const { rows: allMessages, create, update } = useCollection('mailbox', seeds.mailbox)
  const [folder, setFolder] = useState('inbox')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ from_name: '', subject: '', body: '', folder: 'sent' })

  const messages = allMessages.filter(m => (m.folder || 'inbox') === folder)

  const handleSend = (e) => {
    e.preventDefault()
    create({ ...form, created_at: new Date().toISOString(), is_read: true, is_starred: false })
    setShowModal(false); setForm({ from_name: '', subject: '', body: '', folder: 'sent' })
  }

  const toggleStar = (msg) => update(msg.id, { is_starred: !msg.is_starred })
  const toggleRead = (msg) => update(msg.id, { is_read: !msg.is_read })
  const deleteMsg = (id) => { if (confirm('Move to trash?')) update(id, { folder: 'trash' }) }

  const folders = [
    { key: 'inbox', label: 'Inbox', icon: Inbox },
    { key: 'sent', label: 'Sent', icon: Send },
    { key: 'draft', label: 'Drafts', icon: FileText },
    { key: 'trash', label: 'Trash', icon: Trash2 },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Mailbox</h3>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage your messages and notifications.</p>
        </div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => { setShowModal(true) }}>
          <Send size={16} /> Compose
        </Button>
      </div>
      <div className="row g-0">
        <div className="col-md-3 col-lg-2">
          <div className="card p-2 border-0 shadow-sm me-md-3">
            {folders.map(f => (
              <button key={f.key} onClick={() => setFolder(f.key)} className={`btn btn-sm text-start d-flex align-items-center gap-2 mb-1 ${folder === f.key ? 'btn-primary' : 'btn-light'}`}>
                <f.icon size={16} /> {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="col-md-9 col-lg-10">
          <div className="card border-0 shadow-sm">
            {messages.length === 0 && <div className="text-center text-muted py-5">No messages in {folder}.</div>}
            {messages.map(msg => (
              <div key={msg.id} className={`d-flex align-items-center gap-3 p-3 ${selected?.id === msg.id ? 'bg-light' : ''}`} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setSelected(msg)}>
                <button className="btn btn-link p-0" onClick={(e) => { e.stopPropagation(); toggleStar(msg) }}>
                  <Star size={16} fill={msg.is_starred ? '#f39c12' : 'none'} color={msg.is_starred ? '#f39c12' : '#cbd5e1'} />
                </button>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className={`fw-semibold ${msg.is_read ? 'text-muted' : 'text-dark'}`} style={{ fontSize: '0.9rem' }}>{msg.from_name || 'System'}</span>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {!msg.is_read && <span className="d-inline-block rounded-circle bg-primary" style={{ width: 8, height: 8 }} />}
                    <span style={{ fontSize: '0.85rem' }}>{msg.subject}</span>
                  </div>
                </div>
                <div className="d-flex gap-1">
                  <Button variant="link" className="p-1 text-muted" onClick={(e) => { e.stopPropagation(); toggleRead(msg) }}><RotateCcw size={14} /></Button>
                  <Button variant="link" className="p-1 text-danger" onClick={(e) => { e.stopPropagation(); deleteMsg(msg.id) }}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
          {selected && (
            <div className="card border-0 shadow-sm mt-3 p-4">
              <h6 className="fw-bold">{selected.subject}</h6>
              <div className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>From: {selected.from_name || 'System'} • {selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</div>
              <p style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{selected.body}</p>
            </div>
          )}
        </div>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">Compose Message</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSend}>
            <Form.Group className="mb-3"><Form.Label>From</Form.Label><Form.Control required value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Subject</Form.Label><Form.Control required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Message</Form.Label><Form.Control as="textarea" rows={5} required value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="btn-accent">Send</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Mailbox

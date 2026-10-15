import { useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'

// fields: [{ name, label, type?: 'text'|'select', options?: [[value,label]], show?: (values)=>bool, col?: 3|4|6|12 }]
export default function FormModal({ title, fields, initial, onSave, onClose, onBlurField }) {
  const [values, setValues] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const patch = (p) => setValues((v) => ({ ...v, ...p }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await onSave(values); onClose() } catch (err) { setError(err.message); setBusy(false) }
  }

  return (
    <Modal show onHide={onClose} size="lg" backdrop="static">
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row className="g-3">
            {fields.filter((f) => !f.show || f.show(values)).map((f) => (
              <Col key={f.name} md={f.col || 6}>
                <Form.Label className="small fw-semibold">{f.label}</Form.Label>
                {f.type === 'select' ? (
                  <Form.Select value={values[f.name] ?? ''} onChange={(e) => patch({ [f.name]: e.target.value })}>
                    {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Form.Select>
                ) : (
                  <Form.Control value={values[f.name] ?? ''} onChange={(e) => patch({ [f.name]: e.target.value })}
                    onBlur={() => onBlurField?.(f.name, values, patch)} />
                )}
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="btn-fp" disabled={busy}>Save</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

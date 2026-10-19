import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Modal } from 'react-bootstrap'

// In-page replacement for window.confirm(). Some browsers (e.g. embedded / in-app ones) block
// native dialogs and window.confirm() then returns false without showing anything, which made
// "Send to Alphalist", Delete and Restore do nothing. This one is a normal Bootstrap modal.
//
//   if (!(await confirmDialog('Archive this line?'))) return
export function confirmDialog(message, { title = 'Please confirm', ok = 'OK', variant = 'primary' } = {}) {
  return new Promise((resolve) => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    const done = (answer) => {
      resolve(answer)
      setTimeout(() => { root.unmount(); host.remove() }, 300)
    }
    root.render(<ConfirmModal title={title} message={message} ok={ok} variant={variant} onDone={done} />)
  })
}

function ConfirmModal({ title, message, ok, variant, onDone }) {
  const [show, setShow] = useState(true)
  const close = (answer) => { setShow(false); onDone(answer) }
  return (
    <Modal show={show} onHide={() => close(false)} centered>
      <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
      <Modal.Body style={{ whiteSpace: 'pre-line' }}>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={() => close(false)}>Cancel</Button>
        <Button variant={variant} autoFocus onClick={() => close(true)}>{ok}</Button>
      </Modal.Footer>
    </Modal>
  )
}

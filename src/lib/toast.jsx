import { useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { CloseButton, Toast, ToastContainer } from 'react-bootstrap'
import { CheckCircleFill, ExclamationTriangleFill, InfoCircleFill } from 'react-bootstrap-icons'

// Short-lived notices in the corner, for things that worked ("Line saved", "Imported 12 lines").
// Errors stay as Alerts on the page, where they can be read and acted on.
//
//   toast('Line saved.')          toast('Alphalist is open.', 'warning')
let toasts = []
let nextId = 1
let mounted = false
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
const dismiss = (id) => { toasts = toasts.filter((t) => t.id !== id); emit() }

export function toast(text, variant = 'success') {
  if (!mounted) {
    mounted = true
    const host = document.createElement('div')
    document.body.appendChild(host)
    createRoot(host).render(<Toaster />)
  }
  toasts = [...toasts, { id: nextId++, text, variant }]
  emit()
}

const ICONS = { success: CheckCircleFill, warning: ExclamationTriangleFill, info: InfoCircleFill }
const COLORS = { success: 'var(--fp-accent)', warning: '#d97706', info: '#2563eb' }

function Toaster() {
  const list = useSyncExternalStore(subscribe, () => toasts)
  return (
    <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 1090 }}>
      {list.map((t) => {
        const Icon = ICONS[t.variant] || InfoCircleFill
        return (
          <Toast key={t.id} onClose={() => dismiss(t.id)} delay={t.variant === 'success' ? 5000 : 8000} autohide
            className="fp-toast" style={{ borderLeftColor: COLORS[t.variant] }}>
            <Toast.Body className="d-flex align-items-start gap-2">
              <Icon className="flex-shrink-0 mt-1" style={{ color: COLORS[t.variant] }} aria-hidden />
              <div className="flex-grow-1">{t.text}</div>
              <CloseButton aria-label="Dismiss" onClick={() => dismiss(t.id)} />
            </Toast.Body>
          </Toast>
        )
      })}
    </ToastContainer>
  )
}

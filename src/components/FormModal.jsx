import { Fragment, useEffect, useState } from 'react'
import { Alert, Button, Col, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap'
import MoneyInput from './MoneyInput'
import { errorMessage } from '../lib/api/client'
import { unformatAmount } from '../lib/money'

// fields: [{ name, label, type?: 'text'|'select'|'date'|'amount'|'rate'|'number', options?: [[value,label]], show?: (values)=>bool,
//            col?: 3|4|6|12, key?, section?: 'Employee', group?: 'Taxable', required?: bool, help?, placeholder? }]
// Fields with a section are drawn in a <fieldset> under that heading, grouped by `group` inside it.
// aside: (values) => node, drawn beside the fields (e.g. a live summary), under them on narrow screens;
// asideCompact: (values) => node, a one-line version kept in view in the footer on narrow screens.
// onBlurField / onChangeField: (name, values, patch) => void
// onSave rejecting with saveError(e) shows the API's field errors next to their fields.
export default function FormModal({ title, fields, initial, onSave, onClose, onBlurField, onChangeField, aside, asideCompact, size = 'lg', idPrefix = 'fm' }) {
  const [values, setValues] = useState(initial)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const patch = (p) => setValues((v) => ({ ...v, ...p }))
  const idOf = (f) => `${idPrefix}-${String(f.key ?? f.name).replace(/\W/g, '-')}`
  const visible = fields.filter((f) => !f.show || f.show(values))

  const change = (f, value) => {
    patch({ [f.name]: value })
    if (fieldErrors[f.name]) setFieldErrors(({ [f.name]: _, ...rest }) => rest)
    onChangeField?.(f.name, { ...values, [f.name]: value }, patch)
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setFieldErrors({})
    const amounts = fields.filter((f) => f.type === 'amount').map((f) => f.name)
    const sent = { ...values, ...Object.fromEntries(amounts.filter((n) => values[n] != null).map((n) => [n, unformatAmount(values[n])])) }
    try { await onSave(sent); onClose() } catch (err) {
      setFieldErrors(err.fields || {})
      setError(err.message)
      setBusy(false)
    }
  }

  // After a failed save, put the cursor in the first field the API complained about.
  useEffect(() => {
    const first = visible.find((f) => fieldErrors[f.name])
    if (first) document.getElementById(idOf(first))?.focus()
  }, [fieldErrors]) // eslint-disable-line react-hooks/exhaustive-deps

  const shownErrors = visible.filter((f) => fieldErrors[f.name]).length
  const otherErrors = Object.entries(fieldErrors).filter(([name]) => !visible.some((f) => f.name === name)).map(([, m]) => m)

  const control = (f, id, invalid) => {
    const common = { value: values[f.name] ?? '', placeholder: f.placeholder, isInvalid: invalid,'aria-invalid': invalid || undefined, 'aria-describedby': invalid ? `${id}-error` : undefined, 'aria-required': f.required || undefined }
    const onBlur = () => onBlurField?.(f.name, values, patch)
    if (f.type === 'select') {
      return <Form.Select {...common} onChange={(e) => change(f, e.target.value)}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Form.Select>
    }
    if (f.type === 'amount') return <MoneyInput {...common} onChange={(v) => change(f, v)} onBlur={onBlur} />
    const input = (
      <Form.Control {...common} type={f.type === 'date' ? 'date' : 'text'} inputMode={f.type === 'rate' || f.type === 'number' ? 'decimal' : undefined}
        className={f.type === 'rate' || f.type === 'number' ? 'text-end' : undefined}
        onChange={(e) => change(f, e.target.value)} onBlur={onBlur} />
    )
    return f.type === 'rate' ? <InputGroup hasValidation>{input}<InputGroup.Text aria-hidden>%</InputGroup.Text></InputGroup> : input
  }

  const field = (f) => {
    const id = idOf(f)
    const msg = fieldErrors[f.name]
    return (
      <Col key={f.key ?? f.name} md={f.col || 6}>
        <Form.Group controlId={id}>
          <Form.Label className="small fw-semibold">{f.label}{f.required && <span className="text-danger" aria-hidden> *</span>}</Form.Label>
          {control(f, id, !!msg)}
          {msg && <Form.Control.Feedback type="invalid" id={`${id}-error`} className="d-block">{msg}</Form.Control.Feedback>}
          {f.help && <Form.Text muted>{f.help}</Form.Text>}
        </Form.Group>
      </Col>
    )
  }

  // [[section, [[group, fields]]]] in the order the fields come.
  const sections = []
  for (const f of visible) {
    let s = sections.find(([name]) => name === f.section)
    if (!s) sections.push(s = [f.section, []])
    let g = s[1].find(([name]) => name === f.group)
    if (!g) s[1].push(g = [f.group, []])
    g[1].push(f)
  }
  const body = sections.map(([section, groups]) => {
    const rows = (
      <Row className="g-3">
        {groups.map(([group, list]) => (
          <Fragment key={group ?? ''}>
            {group && <Col xs={12} className="fp-subhead pt-2">{group}</Col>}
            {list.map(field)}
          </Fragment>
        ))}
      </Row>
    )
    return section
      ? <fieldset key={section} className="fp-fieldset"><legend>{section}</legend>{rows}</fieldset>
      : <Fragment key="">{rows}</Fragment>
  })

  return (
    <Modal show onHide={onClose} size={size} backdrop="static" scrollable>
      <Form onSubmit={submit} noValidate className="fp-modal-form">
        <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger">
              {shownErrors ? 'Please correct the highlighted fields.' : (otherErrors.length ? null : error)}
              {otherErrors.length > 0 && <ul className="mb-0">{otherErrors.map((m, i) => <li key={i}>{m}</li>)}</ul>}
            </Alert>
          )}
          {aside
            ? <Row className="g-4"><Col lg={8}>{body}</Col><Col lg={4}><div className="fp-summary">{aside(values)}</div></Col></Row>
            : body}
        </Modal.Body>
        <Modal.Footer>
          {asideCompact && <div className="me-auto small d-lg-none">{asideCompact(values)}</div>}
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="btn-fp" disabled={busy}>{busy ? <><Spinner size="sm" aria-hidden /> Saving…</> : 'Save'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

// API errors -> an Error FormModal shows field by field. Laravel keys them by input ("tin") or, for a form line's
// values, "values.nationality"; both land on the field of that name.
export function saveError(e) {
  const errors = e.response?.data?.errors
  const fields = errors && !Array.isArray(errors)
    ? Object.fromEntries(Object.entries(errors).map(([k, m]) => [k.replace(/^values\./, ''), Array.isArray(m) ? m.join(' ') : String(m)]))
    : {}
  return Object.assign(new Error(errorMessage(e)), { fields })
}

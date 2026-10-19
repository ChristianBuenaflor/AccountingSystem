import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Badge, Button, Col, Form, InputGroup, Modal, Row, Spinner, Table } from 'react-bootstrap'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { alphalistLabel, alphalistLink, atcsFor, billsApi, customersApi, invoicesApi, suppliersApi } from '../../lib/api/books'
import { errorMessage } from '../../lib/api/client'
import { confirmDialog } from '../../lib/confirm'
import { toast } from '../../lib/toast'
import { agentName, useAgents } from '../AgentPicker'
import { SkeletonRows } from '../Loading'
import MoneyInput from '../MoneyInput'
import Pager, { SearchBox } from '../Pager'
import PartnerPicker from '../PartnerPicker'

const sales = { api: invoicesApi, partner: 'customer', partners: customersApi, partnerLabel: 'Customer', partnersPath: '/sales/customers' }
const purchases = { api: billsApi, partner: 'supplier', partners: suppliersApi, partnerLabel: 'Supplier', partnersPath: '/purchases/suppliers' }

// One screen per document type. The bill carries tax withheld from the supplier (-> QAP 1601-EQ or MAP),
// the invoice the customer's 2307 (-> SAWT); quotes, orders and purchase orders have no withholding.
const DOCS = {
  invoice: { ...sales, title: 'Sales', sub: "Manage invoices, quotes, and sales orders. A customer's 2307 recorded on an invoice goes to your SAWT.", noun: 'Invoice', numberLabel: 'Invoice #', dueLabel: 'Due Date', status: 'draft', statuses: { draft: 'secondary', sent: 'info', paid: 'success', overdue: 'danger' }, wtax: 'sawt_form' },
  quote: { ...sales, title: 'Quotes', sub: 'Manage customer quotes and proposals.', noun: 'Quote', numberLabel: 'Quote #', dueLabel: 'Expiry', status: 'draft', statuses: { draft: 'secondary', sent: 'info', accepted: 'success', rejected: 'danger', expired: 'warning' } },
  order: { ...sales, title: 'Sales Orders', sub: 'Manage sales orders and fulfillment.', noun: 'Order', numberLabel: 'Order #', dueLabel: 'Delivery', status: 'pending', statuses: { pending: 'warning', confirmed: 'info', shipped: 'primary', delivered: 'success', cancelled: 'danger' } },
  bill: { ...purchases, title: 'Bills', sub: 'Manage supplier bills and payables. Tax you withhold from a supplier goes to your QAP 1601-EQ (MAP 1600-VT/PT for a government buyer).', noun: 'Bill', numberLabel: 'Bill #', dueLabel: 'Due Date', status: 'draft', statuses: { draft: 'secondary', sent: 'info', received: 'primary', paid: 'success', overdue: 'danger' }, wtax: 'wtax_form' },
  purchase_order: { ...purchases, title: 'Purchases', sub: 'Manage purchase orders. Record the bill when the supplier invoices you.', noun: 'Purchase Order', numberLabel: 'PO Number', dueLabel: 'Delivery', status: 'draft', statuses: { draft: 'secondary', sent: 'info', received: 'primary', paid: 'success' } },
}

const WTAX_FORMS = {
  wtax_form: {
    title: 'Tax withheld from the supplier (BIR)',
    label: 'Report on',
    options: [['', 'No tax withheld'], ['1601EQ', 'QAP 1601-EQ - expanded withholding tax'], ['1600VT', 'MAP 1600-VT - VAT withheld (government buyer)'], ['1600PT', 'MAP 1600-PT - percentage tax withheld (government buyer)']],
    agentLabel: 'Withholding agent (your company)',
    taxLabel: 'Tax withheld',
  },
  sawt_form: {
    title: "Customer's 2307 - tax withheld from you (BIR)",
    label: 'SAWT attached to',
    options: [['', 'No 2307'], ['2550M', '2550M - monthly VAT'], ['2550Q', '2550Q - quarterly VAT'], ['2551Q', '2551Q - percentage tax'], ['1701Q', '1701Q - income tax (individual)'], ['1702Q', '1702Q - income tax (corporation)']],
    agentLabel: 'Your company (files the SAWT)',
    taxLabel: 'Amount withheld (per 2307)',
  },
}

const num = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0
const peso = (v) => `₱${num(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const taxOf = (base, rate) => (base === '' || rate === '' ? '' : (Math.round(num(base) * 100 * num(rate) * 100 / 10000) / 100).toFixed(2))

// Where the line will go, worked out like the API does (quarter for 1601-EQ and the Q returns, else the month).
const destination = (form, date) => {
  if (!form || !date) return ''
  const [y, m] = date.split('-').map(Number)
  const quarterly = form === '1601EQ' || form.endsWith('Q')
  const line = { form_type: form, year: y, quarter: Math.ceil(m / 3), month: quarterly ? Math.ceil(m / 3) * 3 : m }
  return alphalistLabel(line)
}

const BLANK = { number: '', partner_id: '', partner: null, date: '', due_date: '', amount: '', status: '', notes: '', form: '', withholding_agent_id: '', atc_code: '', tax_rate: '', tax_base: '', tax_withheld: '' }

export default function DocumentsPage({ docType }) {
  const doc = DOCS[docType]
  const { api, partner, partners: partnersApi, partnerLabel, statuses } = doc
  const wtax = doc.wtax && WTAX_FORMS[doc.wtax]
  const { agents, id: agentId } = useAgents()
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [atcs, setAtcs] = useState([])
  const [taxTyped, setTaxTyped] = useState(false) // tax withheld typed by hand: stop recomputing it
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // One page at a time (20), searched on the server: lists stay fast and complete at any size.
  const load = useCallback(() => {
    setLoading(true)
    api.page({ doc_type: docType, page, search: query })
      .then(({ rows: r, pagination: p }) => { setRows(r); setPagination(p) })
      .catch((e) => setMsg({ variant: 'danger', text: errorMessage(e) }))
      .finally(() => setLoading(false))
  }, [api, docType, page, query])
  useEffect(load, [load])
  const searchFor = (q) => { setQuery(q); setPage(1) }

  useEffect(() => {
    if (!form?.form) { setAtcs([]); return }
    atcsFor(form.form).then(setAtcs).catch((e) => setError(errorMessage(e)))
  }, [form?.form])

  const open = (row) => {
    setError(''); setTaxTyped(false)
    if (!row) return setForm({ ...BLANK, status: doc.status, date: new Date().toISOString().slice(0, 10), withholding_agent_id: agentId })
    setForm({
      id: row.id, number: row.number, partner_id: row[`${partner}_id`], partner: row[partner] ?? null, date: row.date ?? '', due_date: row.due_date ?? '',
      amount: row.amount, status: row.status, notes: row.notes ?? '', form: (wtax && row[doc.wtax]) || '',
      withholding_agent_id: row.withholding_agent_id || agentId, atc_code: row.atc_code ?? '', tax_rate: row.tax_rate ?? '',
      tax_base: row.tax_base ?? '', tax_withheld: row.tax_withheld ?? '',
    })
  }

  // A BIR line's "From bill BL-0001" link opens that document: ?open=12
  const [search, setSearch] = useSearchParams()
  useEffect(() => {
    const id = search.get('open')
    if (!id) return
    setSearch((s) => { const next = new URLSearchParams(s); next.delete('open'); return next }, { replace: true })
    const row = rows.find((r) => String(r.id) === id)
    if (row) open(row)
    else api.get(id).then(open).catch((e) => setMsg({ variant: 'danger', text: errorMessage(e) }))
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  // Edits that move the computed amounts: the base follows the amount until it is changed, the rate comes
  // from the ATC, and the tax is base x rate until it is typed.
  const change = (patch) => setForm((f) => {
    const next = { ...f, ...patch }
    if ('amount' in patch && (f.tax_base === '' || num(f.tax_base) === num(f.amount))) next.tax_base = patch.amount
    if ('atc_code' in patch) {
      const atc = atcs.find((a) => a.code === patch.atc_code)
      if (atc?.rate != null) next.tax_rate = num(atc.rate).toFixed(2)
    }
    if ('form' in patch && patch.form && next.tax_base === '') next.tax_base = next.amount
    if (!taxTyped && !('tax_withheld' in patch)) next.tax_withheld = taxOf(next.tax_base, next.tax_rate)
    return next
  })
  const set = (k) => (e) => change({ [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    const { partner_id, partner: _chosen, form: wtaxForm, ...rest } = form
    const body = { ...rest, doc_type: docType, [`${partner}_id`]: partner_id }
    if (wtax) body[doc.wtax] = wtaxForm
    try {
      const { message } = await api.save(body)
      setForm(null); toast(message || `${doc.noun} saved.`); load()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  const handleDelete = async (row) => {
    const note = row.alphalist_line ? ` Its ${alphalistLabel(row.alphalist_line)} line is removed too.` : ''
    if (!await confirmDialog(`Archive ${row.number}?${note}`, { ok: 'Archive', variant: 'danger' })) return
    try { await api.remove(row.id); toast(`${doc.noun} ${row.number} archived.`); load() } catch (e) { setMsg({ variant: 'danger', text: errorMessage(e) }) }
  }

  const statusBadge = (s) => <Badge bg={statuses[s] || 'secondary'} text={statuses[s] === 'warning' ? 'dark' : undefined}>{s}</Badge>
  const chosen = form?.partner
  const cols = 8 + (wtax ? 1 : 0)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h3 className="fw-bold mb-1">{doc.title}</h3><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{doc.sub}</p></div>
        <Button className="btn-accent d-flex align-items-center gap-2" onClick={() => open(null)}><Plus size={18} /> New {doc.noun}</Button>
      </div>
      {msg && <Alert variant={msg.variant} dismissible onClose={() => setMsg(null)}>{msg.text}</Alert>}

      <div className="card p-0 overflow-hidden">
        <div className="fp-list-tools">
          <SearchBox value={query} onSearch={searchFor} placeholder={`Search number or ${partnerLabel.toLowerCase()}`} label={`Search ${doc.noun.toLowerCase()}s`} />
          {loading && rows.length > 0 && <Spinner size="sm" className="text-muted" aria-label="Loading" />}
        </div>
        <Table responsive hover className="mb-0 fp-stack">
          <thead><tr><th className="fp-hide-narrow">#</th><th>{doc.numberLabel}</th><th>{partnerLabel}</th><th>Date</th><th className="fp-hide-narrow">{doc.dueLabel}</th><th className="fp-num">Amount</th><th>Status</th>{wtax && <th>BIR</th>}<th className="fp-actions"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            {loading && rows.length === 0 && <SkeletonRows cols={cols} hide={[0, 4]} />}
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="fp-hide-narrow">{((pagination?.current_page ?? 1) - 1) * (pagination?.per_page ?? 0) + i + 1}</td>
                <td className="fw-semibold text-nowrap"><FileText size={14} className="me-2 text-muted" aria-hidden />{r.number}</td>
                <td className="fp-name">{r[partner]?.name || '—'}</td>
                <td className="text-nowrap">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                <td className="fp-hide-narrow text-nowrap">{r.due_date ? new Date(r.due_date).toLocaleDateString() : '—'}</td>
                <td className="fw-semibold fp-num">{peso(r.amount)}</td>
                <td>{statusBadge(r.status)}</td>
                {wtax && <td style={{ fontSize: '0.8rem' }}>{r.alphalist_line
                  ? <Link to={alphalistLink(r.alphalist_line)} title="Open the Alphalist line">{alphalistLabel(r.alphalist_line)}<div className="text-muted">{r.atc_code} · {peso(r.tax_withheld)}</div></Link>
                  : <span className="text-muted">—</span>}</td>}
                <td className="fp-actions">
                  <Button variant="link" className="p-1" onClick={() => open(r)} aria-label={`Edit ${r.number}`} title="Edit"><Pencil size={16} aria-hidden /></Button>
                  <Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(r)} aria-label={`Archive ${r.number}`} title="Archive"><Trash2 size={16} aria-hidden /></Button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan={cols} className="text-center text-muted py-4">{query ? `No ${doc.noun.toLowerCase()}s match "${query}".` : `No ${doc.noun.toLowerCase()}s yet.`}</td></tr>}
          </tbody>
        </Table>
        <Pager pagination={pagination} onPage={setPage} noun={`${doc.noun.toLowerCase()}s`} />
      </div>

      <Modal show={!!form} onHide={() => setForm(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{form?.id ? `Edit ${doc.noun}` : `New ${doc.noun}`}</Modal.Title></Modal.Header>
        <Modal.Body>
          {form && (
            <Form onSubmit={handleSubmit}>
              {error && <Alert variant="danger">{error}</Alert>}
              <Row className="g-3">
                <Col md={6}><Form.Group controlId="doc-number"><Form.Label>{doc.numberLabel.replace(' #', ' Number')}</Form.Label><Form.Control placeholder="Next number" value={form.number} onChange={set('number')} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label htmlFor="doc-partner">{partnerLabel}</Form.Label>
                  <PartnerPicker id="doc-partner" api={partnersApi} required noun={partnerLabel.toLowerCase()} value={form.partner}
                    onChange={(p) => change({ partner: p, partner_id: p?.id ?? '' })} />
                  <Form.Text>Not listed? <Link to={doc.partnersPath}>Add the {partnerLabel.toLowerCase()}</Link> first.</Form.Text>
                </Form.Group></Col>
                <Col md={6}><Form.Group controlId="doc-date"><Form.Label>Date</Form.Label><Form.Control type="date" required value={form.date} onChange={set('date')} /></Form.Group></Col>
                <Col md={6}><Form.Group controlId="doc-due"><Form.Label>{doc.dueLabel}</Form.Label><Form.Control type="date" value={form.due_date} onChange={set('due_date')} /></Form.Group></Col>
                <Col md={6}><Form.Group controlId="doc-amount"><Form.Label>Total Amount</Form.Label><MoneyInput required value={form.amount} onChange={(v) => change({ amount: v })} /></Form.Group></Col>
                <Col md={6}><Form.Group controlId="doc-status"><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={set('status')}>
                  {form.status && !statuses[form.status] && <option>{form.status}</option>}
                  {Object.keys(statuses).map((s) => <option key={s}>{s}</option>)}
                </Form.Select></Form.Group></Col>
                <Col md={12}><Form.Group controlId="doc-notes"><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={2} value={form.notes} onChange={set('notes')} /></Form.Group></Col>
              </Row>

              {wtax && (
                <div className="border rounded p-3 mt-4" style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <div className="fw-semibold mb-2">{wtax.title}</div>
                  <Row className="g-3">
                    <Col md={form.form ? 6 : 12}><Form.Group controlId="doc-wtax-form"><Form.Label>{wtax.label}</Form.Label>
                      <Form.Select value={form.form} onChange={(e) => change({ form: e.target.value, atc_code: '', tax_rate: '' })}>
                        {wtax.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </Form.Select>
                    </Form.Group></Col>
                    {form.form && <>
                      <Col md={6}><Form.Group controlId="doc-agent"><Form.Label>{wtax.agentLabel}</Form.Label>
                        <Form.Select required value={form.withholding_agent_id} onChange={set('withholding_agent_id')}>
                          <option value="">Select...</option>
                          {agents.map((a) => <option key={a.id} value={a.id}>{agentName(a)} ({a.tin})</option>)}
                        </Form.Select>
                        {agents.length === 0 && <Form.Text>Add your company under <Link to="/alphalist/agents">Withholding Agents</Link> first.</Form.Text>}
                      </Form.Group></Col>
                      <Col md={8}><Form.Group controlId="doc-atc"><Form.Label>ATC</Form.Label>
                        <Form.Select required value={form.atc_code} onChange={set('atc_code')}>
                          <option value="">Select ATC</option>
                          {form.atc_code && !atcs.some((a) => a.code === form.atc_code) && <option value={form.atc_code}>{form.atc_code}</option>}
                          {atcs.map((a) => <option key={a.code} value={a.code}>{a.code} - {a.description ?? ''}{a.rate != null ? ` (${num(a.rate)}%)` : ''}</option>)}
                        </Form.Select>
                      </Form.Group></Col>
                      <Col md={4}><Form.Group controlId="doc-rate"><Form.Label>Rate</Form.Label><InputGroup><Form.Control type="number" step="0.01" min="0" max="100" className="text-end" value={form.tax_rate} onChange={set('tax_rate')} /><InputGroup.Text aria-hidden>%</InputGroup.Text></InputGroup></Form.Group></Col>
                      <Col md={6}><Form.Group controlId="doc-base"><Form.Label>Tax base (income payment)</Form.Label><MoneyInput value={form.tax_base} onChange={(v) => change({ tax_base: v })} /></Form.Group></Col>
                      <Col md={6}><Form.Group controlId="doc-tax"><Form.Label>{wtax.taxLabel}</Form.Label><MoneyInput placeholder="base x rate" value={form.tax_withheld}
                        onChange={(v) => { setTaxTyped(v !== ''); change({ tax_withheld: v }) }} /></Form.Group></Col>
                      <Col md={12}>
                        {chosen && !chosen.formatted_tin
                          ? <Alert variant="warning" className="mb-0 py-2">{chosen.name} has no TIN yet. <Link to={doc.partnersPath}>Add it</Link> before saving: the Alphalist line needs it.</Alert>
                          : <div className="text-muted small">Saving puts this on <strong>{destination(form.form, form.date)}</strong>{chosen ? <> for {chosen.name} ({chosen.formatted_tin})</> : null}. Editing or archiving this {doc.noun.toLowerCase()} updates that line.</div>}
                      </Col>
                    </>}
                  </Row>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="light" onClick={() => setForm(null)}>Cancel</Button>
                <Button type="submit" className="btn-accent" disabled={busy}>{busy && <Spinner size="sm" aria-hidden />} {form.id ? 'Update' : 'Create'}</Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}

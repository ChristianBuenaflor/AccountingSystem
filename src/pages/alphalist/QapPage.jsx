import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Form, Modal, Table } from 'react-bootstrap'
import { Plus } from 'react-bootstrap-icons'
import { alphalistApi, payeesApi, qapApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import AgentPicker, { payeeName, useAgents } from '../../components/AgentPicker'
import AnalysisView from '../../components/AnalysisView'
import FormModal from '../../components/FormModal'
import PageHeader from '../../components/PageHeader'
import { STATUS } from './PayeesPage'

const money = (v) => (v == null || v === '' ? '' : Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 }))
const isI = (v) => v.payee_type === 'I'

export default function QapPage() {
  const { agents, id: agentId, setId } = useAgents()
  const now = new Date()
  const [period, setPeriod] = useState({ form: '1601EQ', year: now.getFullYear(), quarter: Math.ceil((now.getMonth() + 1) / 3) })
  const [data, setData] = useState(null)
  const [edit, setEdit] = useState(null)
  const [preview, setPreview] = useState(null)
  const [msg, setMsg] = useState(null) // { variant, text } (text may be a list)
  const csvRef = useRef(null)

  const load = useCallback(() => {
    if (!agentId) return
    qapApi.get(agentId, period).then(setData).catch((e) => setMsg({ variant: 'danger', text: errorMessage(e) }))
  }, [agentId, period])
  useEffect(load, [load])

  const set = (k, v) => setPeriod((p) => ({ ...p, [k]: v }))

  const fields = data && [
    { name: 'schedule', label: 'Schedule', col: 12, type: 'select', options: Object.entries(data.schedules) },
    { name: 'tin', label: 'TIN (9 digits)', col: 4 }, { name: 'branch_code', label: 'Branch', col: 4 },
    { name: 'payee_type', label: 'Payee type', col: 4, type: 'select', options: [['I', 'Individual'], ['N', 'Non-individual']] },
    { name: 'registered_name', label: 'Registered name', col: 12, show: (v) => !isI(v) },
    { name: 'last_name', label: 'Last name', col: 4, show: isI }, { name: 'first_name', label: 'First name', col: 4, show: isI }, { name: 'middle_name', label: 'Middle name', col: 4, show: isI },
    { name: 'status_code', label: 'Status code', col: 4, type: 'select', options: [['', '-'], ...STATUS.map((s) => [s, s])] },
    { name: 'atc_code', label: 'ATC', col: 8, type: 'select', options: [['', 'Select ATC'], ...data.atcs.map((a) => [a.code, `${a.code} - ${a.description ?? ''}`])] },
    { name: 'tax_rate', label: 'Tax rate %', col: 3 }, { name: 'income_payment', label: 'Income payment', col: 3 },
    { name: 'tax_withheld', label: 'Tax withheld (auto if blank)', col: 3 },
    { name: 'fringe_benefit', label: 'Fringe benefit (1601-FQ Sch. 2)', col: 6, show: () => period.form === '1601FQ' },
    { name: 'monetary_value', label: 'Monetary value', col: 6, show: () => period.form === '1601FQ' },
  ]

  // Typing a TIN fills in the payee and the ATC/rate last used for them.
  const lookup = async (name, v, patch) => {
    if (name !== 'tin' && name !== 'branch_code') return
    if (String(v.tin || '').replace(/\D/g, '').length < 9) return
    try {
      const r = await payeesApi.lookup({ tin: v.tin, branch: v.branch_code, agent: agentId, form: period.form })
      if (!r.found) return
      const { id, created_at, updated_at, ...payee } = r.payee // never copy the payee's id into the line
      patch({ ...payee, ...(r.last && !v.atc_code ? { atc_code: r.last.atc_code, tax_rate: r.last.tax_rate ?? '' } : {}) })
    } catch { /* lookup is a convenience only */ }
  }

  const save = (v) => (v.id ? qapApi.update(agentId, period, v.id, v) : qapApi.add(agentId, period, v))
    .then(load).catch((e) => { throw new Error(errorMessage(e)) })

  const startEdit = (e) => setEdit({ ...e.payee, ...e, id: e.id })
  const remove = async (e) => {
    if (!window.confirm('Delete this line?')) return
    try { await qapApi.remove(agentId, e.id); load() } catch (err) { setMsg({ variant: 'danger', text: errorMessage(err) }) }
  }
  const showPreview = () => qapApi.preview(agentId, period).then(setPreview).catch((e) => setMsg({ variant: 'danger', text: errorMessage(e) }))
  const send = async () => {
    if (!window.confirm('Write these lines into BIR Alphalist? Alphalist must be closed. A backup is taken first.')) return
    try {
      const { log } = await alphalistApi.send(agentId, { form: period.form, year: period.year, quarter: period.quarter })
      setMsg({ variant: 'success', text: `Sent ${log.rows_added} line(s) to BIR Alphalist${log.rows_replaced ? ` (replaced ${log.rows_replaced})` : ''}. Open Alphalist and pick the same return period.` })
      load()
    } catch (e) { setMsg({ variant: 'danger', text: errorMessage(e) }) }
  }
  const importCsv = async (e) => {
    const file = e.target.files[0]; e.target.value = ''
    if (!file) return
    try {
      const r = await qapApi.import(agentId, period, file)
      setMsg({ variant: 'success', text: `Imported ${r.imported} line(s).` }); load()
    } catch (err) {
      const errors = err.response?.data?.errors
      setMsg({ variant: 'danger', text: Array.isArray(errors) ? errors : errorMessage(err) })
    }
  }

  const fq = period.form === '1601FQ'
  return (
    <>
      <PageHeader title="QAP Entry" sub="Key quarterly withholding lines, then generate the DAT or send them to Alphalist.">
        <AgentPicker agents={agents} value={agentId} onChange={setId} />
      </PageHeader>
      {msg && <Alert variant={msg.variant} dismissible onClose={() => setMsg(null)}>{Array.isArray(msg.text) ? <ul className="mb-0">{msg.text.map((t, i) => <li key={i}>{t}</li>)}</ul> : msg.text}</Alert>}
      <div className="d-flex gap-2 flex-wrap mb-3">
        <Form.Select style={{ width: 130 }} value={period.form} onChange={(e) => set('form', e.target.value)}>
          <option value="1601EQ">1601-EQ</option><option value="1601FQ">1601-FQ</option>
        </Form.Select>
        <Form.Select style={{ width: 110 }} value={period.quarter} onChange={(e) => set('quarter', Number(e.target.value))}>
          {[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}</option>)}
        </Form.Select>
        <Form.Control type="number" style={{ width: 100 }} value={period.year} onChange={(e) => set('year', Number(e.target.value))} />
        <div className="ms-auto d-flex gap-2 flex-wrap">
          <input ref={csvRef} type="file" accept=".csv" hidden onChange={importCsv} />
          <Button variant="light" href={qapApi.templateUrl}>CSV template</Button>
          <Button variant="light" disabled={!agentId} onClick={() => csvRef.current.click()}>Import CSV</Button>
          <Button variant="light" disabled={!agentId} onClick={showPreview}>Preview DAT</Button>
          <Button variant="light" disabled={!agentId} href={agentId ? qapApi.downloadUrl(agentId, period) : undefined}>Download DAT</Button>
          <Button variant="dark" disabled={!agentId} onClick={send}>Send to Alphalist</Button>
          <Button className="btn-fp" disabled={!data} onClick={() => setEdit({ schedule: 'D1', branch_code: '0000', payee_type: 'I' })}><Plus size={20} /> New Line</Button>
        </div>
      </div>
      {data?.alphalist && !data.alphalist.found && <Alert variant="warning">{data.alphalist.error}</Alert>}
      {data?.alphalist?.locked && <Alert variant="warning">BIR Alphalist is open. Close it before sending.</Alert>}

      {data && Object.entries(data.schedules).map(([sch, title]) => {
        const rows = data.entries[sch] || []
        const fringe = fq && sch === 'D2'
        return (
          <div className="fp-card mb-3" key={sch}>
            <div className="p-3 fw-semibold border-bottom">{title}</div>
            <Table responsive className="mb-0 align-middle">
              <thead><tr><th>#</th><th>TIN</th><th>Payee</th><th>ATC</th><th>Rate</th><th>{fringe ? 'Fringe benefit' : 'Income payment'}</th><th>{fringe ? 'Monetary value' : 'Tax withheld'}</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={8} className="fp-empty">No lines.</td></tr>}
                {rows.map((e, i) => (
                  <tr key={e.id}>
                    <td>{i + 1}</td><td>{e.payee?.tin}-{e.payee?.branch_code}</td><td>{payeeName(e.payee)}</td><td>{e.atc_code}</td><td>{e.tax_rate}</td>
                    <td>{money(fringe ? e.fringe_benefit : e.income_payment)}</td><td>{money(fringe ? e.monetary_value : e.tax_withheld)}</td>
                    <td className="text-nowrap">
                      <Button size="sm" variant="light" onClick={() => startEdit(e)}>Edit</Button>{' '}
                      <Button size="sm" variant="outline-danger" onClick={() => remove(e)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )
      })}
      {data?.last_sync && <div className="fp-sub">Last sent to Alphalist: {new Date(data.last_sync.created_at).toLocaleString()} ({data.last_sync.rows_added} lines)</div>}

      {edit && fields && <FormModal title={edit.id ? 'Edit line' : 'New line'} fields={fields} initial={edit} onSave={save} onClose={() => setEdit(null)} onBlurField={lookup} />}

      <Modal show={!!preview} onHide={() => setPreview(null)} size="xl">
        <Modal.Header closeButton><Modal.Title>{preview?.filename}</Modal.Title></Modal.Header>
        <Modal.Body>
          {preview?.empty && <Alert variant="warning">No lines for this period yet.</Alert>}
          {preview && <AnalysisView analysis={preview.analysis} />}
          <h5 className="mt-4">DAT contents</h5>
          <Card body className="bg-light"><pre className="mb-0" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{preview?.lines?.join('\n')}</pre></Card>
        </Modal.Body>
      </Modal>
    </>
  )
}

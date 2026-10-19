import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Button, Card, Form, Modal, Spinner, Table } from 'react-bootstrap'
import { PencilSquare, Plus, Trash } from 'react-bootstrap-icons'
import { payeesApi, qapApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import { agentName, payeeName, pad4, useAgents } from '../../components/AgentPicker'
import AnalysisView from '../../components/AnalysisView'
import BirValidation from '../../components/BirValidation'
import FormModal, { saveError } from '../../components/FormModal'
import { LoadError, SkeletonRows } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import Pager, { SearchBox } from '../../components/Pager'
import { findLines, pageOf } from '../../lib/pagedLines'
import PeriodsWithLines, { usePeriodStats } from '../../components/PeriodsWithLines'
import SendDialog from '../../components/SendDialog'
import SourceLink from '../../components/SourceLink'
import { STATUS } from './PayeesPage'
import { confirmDialog } from '../../lib/confirm'
import { money } from '../../lib/money'
import { toast } from '../../lib/toast'
import useLoad from '../../lib/useLoad'

const isI = (v) => v.payee_type === 'I'
const QAP_CODES = ['1601EQ', '1601FQ']

export default function QapPage() {
  const { agents, id: agentId, agent, setId, loading: agentsLoading } = useAgents()
  const now = new Date()
  const [period, setPeriod] = useState({ form: '1601EQ', year: now.getFullYear(), quarter: Math.ceil((now.getMonth() + 1) / 3) })
  // Purchases > "Tax Withheld from Suppliers" opens on ?form=1601EQ; a bill's BIR link adds &year=&quarter=
  const [search] = useSearchParams()
  const linked = useRef(!!search.get('quarter'))
  useEffect(() => {
    const form = search.get('form')
    const year = Number(search.get('year'))
    const quarter = Number(search.get('quarter'))
    const patch = {
      ...(form === '1601EQ' || form === '1601FQ' ? { form } : {}),
      ...(year ? { year } : {}),
      ...(quarter >= 1 && quarter <= 4 ? { quarter } : {}),
    }
    if (Object.keys(patch).length) setPeriod((p) => ({ ...p, ...patch }))
    // ...and &agent= picks the document's withholding agent
    if (search.get('agent')) setId(search.get('agent'))
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps
  const [edit, setEdit] = useState(null)
  const [preview, setPreview] = useState(null)
  const [msg, setMsg] = useState(null) // error: { text } (text may be a list)
  const [working, setWorking] = useState('') // 'preview' | 'download' | 'import' while that button waits
  const [sending, setSending] = useState(null) // params of the open Send window
  const csvRef = useRef(null)

  const { data, loading: linesLoading, error: loadError, reload: reloadLines } = useLoad(() => agentId && qapApi.get(agentId, period), [agentId, period])
  const loading = agentsLoading || linesLoading

  // Which forms / quarters of the year have lines (GET /api/filing-status).
  const stats = usePeriodStats(agentId, period.year)
  const reload = () => { reloadLines(); stats.reload() }
  // Open on the latest quarter that has lines (once per company and year), unless a link chose the quarter.
  const autoPicked = useRef('')
  useEffect(() => {
    const key = `${agentId}-${period.year}`
    if (!stats.ready || !agentId || autoPicked.current === key) return
    autoPicked.current = key
    if (linked.current) { linked.current = false; return }
    // Purchases > "Tax Withheld from Suppliers" asks for 1601-EQ: stay on it
    const latest = stats.periods(search.get('form') === '1601EQ' ? ['1601EQ'] : QAP_CODES)[0]
    if (latest) setPeriod((p) => ({ ...p, form: latest.pick.form, quarter: latest.pick.quarter }))
  }, [stats, agentId, period.year]) // eslint-disable-line react-hooks/exhaustive-deps
  // Lines drawn 20 at a time per schedule, with a quick find (all of them still count in totals and sends).
  const [find, setFind] = useState('')
  const [pages, setPages] = useState({})
  useEffect(() => { setPages({}) }, [agentId, period, find])
  const lineCountAll = Object.values(data?.entries ?? {}).reduce((n, rows) => n + rows.length, 0)
  const pickPeriod = (to) => setPeriod((p) => ({ ...p, form: to.form, quarter: to.quarter }))
  const isCurrent = (to) => to.form === period.form && to.quarter === period.quarter
  const lineCount = (n) => (n ? ` — ${n} line${n === 1 ? '' : 's'}` : '')

  const set = (k, v) => setPeriod((p) => ({ ...p, [k]: v }))
  const fail = (e) => setMsg({ text: errorMessage(e) })

  const fields = data && [
    { name: 'schedule', label: 'Schedule', col: 12, type: 'select', options: Object.entries(data.schedules) },
    { name: 'tin', label: 'TIN (9 digits)', col: 4, required: true }, { name: 'branch_code', label: 'Branch', col: 4 },
    { name: 'payee_type', label: 'Payee type', col: 4, type: 'select', options: [['I', 'Individual'], ['N', 'Non-individual']] },
    { name: 'registered_name', label: 'Registered name', col: 12, show: (v) => !isI(v), required: true },
    { name: 'last_name', label: 'Last name', col: 4, show: isI, required: true }, { name: 'first_name', label: 'First name', col: 4, show: isI }, { name: 'middle_name', label: 'Middle name', col: 4, show: isI },
    { name: 'status_code', label: 'Status code', col: 4, type: 'select', options: [['', '-'], ...STATUS.map((s) => [s, s])] },
    { name: 'atc_code', label: 'ATC', col: 8, type: 'select', options: [['', 'Select ATC'], ...data.atcs.map((a) => [a.code, `${a.code} - ${a.description ?? ''}`])], required: true },
    { name: 'tax_rate', label: 'Tax rate', col: 3, type: 'rate' },
    { name: 'income_payment', label: 'Income payment', col: 5, type: 'amount' },
    { name: 'tax_withheld', label: 'Tax withheld', col: 4, type: 'amount', help: 'Blank: income x rate.' },
    { name: 'fringe_benefit', label: 'Fringe benefit (1601-FQ Sch. 2)', col: 6, type: 'amount', show: () => period.form === '1601FQ' },
    { name: 'monetary_value', label: 'Monetary value', col: 6, type: 'amount', show: () => period.form === '1601FQ' },
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

  const label = `QAP ${period.form}, Q${period.quarter} ${period.year}`
  const save = (v) => (v.id ? qapApi.update(agentId, period, v.id, v) : qapApi.add(agentId, period, v))
    .then(() => { toast(v.id ? 'Line updated.' : `Line added to ${label}.`); reload() })
    .catch((e) => { throw saveError(e) })

  const startEdit = (e) => setEdit({ ...e.payee, ...e, id: e.id })
  const remove = async (e) => {
    if (!await confirmDialog(`Remove the line for ${payeeName(e.payee)}? (It is archived and left out of DAT files and sends.)`, { ok: 'Remove', variant: 'danger' })) return
    try { await qapApi.remove(agentId, e.id); toast('Line removed.'); reload() } catch (err) { fail(err) }
  }
  const run = (what, p) => { setWorking(what); setMsg(null); return p.catch(fail).finally(() => setWorking('')) }
  const importCsv = async (e) => {
    const file = e.target.files[0]; e.target.value = ''
    if (!file) return
    setWorking('import'); setMsg(null)
    try {
      const r = await qapApi.import(agentId, period, file)
      toast(`Imported ${r.imported} line(s) into ${label}.`); reload()
    } catch (err) {
      const errors = err.response?.data?.errors
      setMsg({ text: Array.isArray(errors) ? errors : errorMessage(err) })
    } finally { setWorking('') }
  }

  const fq = period.form === '1601FQ'
  const schedules = data ? Object.entries(data.schedules) : [['', 'Loading…']]
  const spin = (what) => working === what && <Spinner size="sm" aria-hidden />
  return (
    <>
      <PageHeader title="QAP Entry" sub="Key quarterly withholding lines, then generate the DAT or send them to Alphalist." />
      <LoadError error={loadError} onRetry={reload} />
      {msg && <Alert variant="danger" dismissible onClose={() => setMsg(null)}>{Array.isArray(msg.text) ? <ul className="mb-0">{msg.text.map((t, i) => <li key={i}>{t}</li>)}</ul> : msg.text}</Alert>}
      {!agentsLoading && agents.length === 0 && <Alert variant="info">Add your company under <Link to="/alphalist/agents">Withholding Agents</Link> first.</Alert>}
      <div className="d-flex gap-2 flex-wrap mb-3">
        <Form.Group controlId="qap-form">
          <Form.Label visuallyHidden>Form</Form.Label>
          <Form.Select style={{ width: 'auto' }} value={period.form} onChange={(e) => set('form', e.target.value)}>
            <option value="1601EQ">1601-EQ{lineCount(stats.count('1601EQ'))}</option>
            <option value="1601FQ">1601-FQ{lineCount(stats.count('1601FQ'))}</option>
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="qap-quarter">
          <Form.Label visuallyHidden>Quarter</Form.Label>
          <Form.Select style={{ width: 'auto' }} value={period.quarter} onChange={(e) => set('quarter', Number(e.target.value))}>
            {[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}{lineCount(stats.count(period.form, q))}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="qap-year">
          <Form.Label visuallyHidden>Year</Form.Label>
          <Form.Control type="number" min={2000} max={2099} style={{ width: 100 }} value={period.year} onChange={(e) => set('year', Number(e.target.value))} />
        </Form.Group>
        <div className="ms-auto d-flex gap-2 flex-wrap">
          <input ref={csvRef} type="file" accept=".csv" hidden onChange={importCsv} aria-label="CSV file to import" />
          <Button variant="light" onClick={() => qapApi.downloadTemplate().catch(fail)}>CSV template</Button>
          <Button variant="light" disabled={!agentId || !!working} onClick={() => csvRef.current.click()}>{spin('import')} Import CSV</Button>
          <Button variant="light" disabled={!agentId || !!working} onClick={() => run('preview', qapApi.preview(agentId, period).then(setPreview))}>{spin('preview')} Preview DAT</Button>
          <Button variant="light" disabled={!agentId || !!working} onClick={() => run('download', qapApi.download(agentId, period))}>{spin('download')} Download DAT</Button>
          <Button variant="dark" disabled={!agentId} onClick={() => setSending({ form: period.form, year: period.year, quarter: period.quarter })}>Send to Alphalist</Button>
          <Button className="btn-fp" disabled={!data} onClick={() => setEdit({ schedule: 'D1', branch_code: '0000', payee_type: 'I' })}><Plus size={20} aria-hidden /> New Line</Button>
        </div>
      </div>
      {agentId && <PeriodsWithLines stats={stats} codes={QAP_CODES} year={period.year} isCurrent={isCurrent} onPick={pickPeriod} />}
      {lineCountAll > 20 && (
        <div className="mb-3"><SearchBox value={find} onSearch={setFind} placeholder="Find payee or TIN in these lines" label="Find lines" delay={200} /></div>
      )}
      {data?.alphalist && !data.alphalist.found && <Alert variant="warning">{data.alphalist.error}</Alert>}
      {data?.alphalist?.locked && <Alert variant="warning">BIR Alphalist is open. Close it before sending.</Alert>}
      <BirValidation agentId={agentId} agentTin={agent?.tin} period={{ form: period.form, year: period.year, quarter: period.quarter }}
        version={data} empty={!data || lineCountAll === 0} />

      {schedules.map(([sch, title]) => {
        const all = data?.entries[sch] || []
        const found = findLines(all, find)
        const { rows, offset, pagination } = pageOf(found, pages[sch])
        const fringe = fq && sch === 'D2'
        const totals = data?.totals?.[sch]
        return (
          <div className="fp-card mb-3" key={sch}>
            <div className="p-3 fw-semibold border-bottom d-flex align-items-center gap-2">
              {title}{linesLoading && data && <Spinner size="sm" className="text-muted" aria-label="Refreshing" />}
            </div>
            <Table responsive className={`mb-0 align-middle fp-stack ${linesLoading && data ? 'fp-table-loading' : ''}`} aria-busy={loading}>
              <thead>
                <tr>
                  <th className="fp-hide-narrow">#</th><th className="fp-hide-narrow">TIN</th><th>Payee</th><th>ATC</th><th className="fp-num">Rate</th>
                  <th className="fp-num">{fringe ? 'Fringe benefit' : 'Income payment'}</th><th className="fp-num">{fringe ? 'Monetary value' : 'Tax withheld'}</th>
                  <th className="fp-actions"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loading && !data && <SkeletonRows cols={8} hide={[0, 1]} />}
                {!loading && data && all.length === 0 && <tr><td colSpan={8} className="fp-empty">No lines for {agent ? agentName(agent) : 'this company'} in Q{period.quarter} {period.year}.</td></tr>}
                {!loading && data && all.length > 0 && found.length === 0 && <tr><td colSpan={8} className="fp-empty">No lines match "{find}".</td></tr>}
                {rows.map((e, i) => (
                  <tr key={e.id}>
                    <td className="fp-hide-narrow">{offset + i + 1}</td>
                    <td className="fp-hide-narrow fp-tin">{e.payee?.tin}-{pad4(e.payee?.branch_code)}</td>
                    <td className="fp-name">{payeeName(e.payee)}<div className="d-lg-none small text-muted fp-tin">{e.payee?.tin}-{pad4(e.payee?.branch_code)}</div></td>
                    <td>{e.atc_code}</td><td className="fp-num">{e.tax_rate}</td>
                    <td className="fp-num">{money(fringe ? e.fringe_benefit : e.income_payment)}</td><td className="fp-num">{money(fringe ? e.monetary_value : e.tax_withheld)}</td>
                    <td className="fp-actions">
                      {/* A line from a bill is changed on the bill (its next save rewrites the line). */}
                      {e.source ? <SourceLink source={e.source} /> : (
                        <>
                          <Button size="sm" variant="light" onClick={() => startEdit(e)} aria-label={`Edit ${payeeName(e.payee)}`} title="Edit"><PencilSquare aria-hidden /></Button>{' '}
                          <Button size="sm" variant="outline-danger" onClick={() => remove(e)} aria-label={`Remove ${payeeName(e.payee)}`} title="Remove"><Trash aria-hidden /></Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {all.length > 1 && totals && (
                <tfoot>
                  <tr className="fw-semibold">
                    <td className="fp-hide-narrow" /><td className="fp-hide-narrow" /><td>Total ({all.length.toLocaleString()}{find ? ' lines, all of them' : ''})</td><td /><td />
                    <td className="fp-num">{money(fringe ? totals.fringe_benefit : totals.income_payment)}</td>
                    <td className="fp-num">{money(fringe ? totals.monetary_value : totals.tax_withheld)}</td><td />
                  </tr>
                </tfoot>
              )}
            </Table>
            <Pager pagination={pagination} onPage={(p) => setPages((s) => ({ ...s, [sch]: p }))} noun={find ? 'matching lines' : 'lines'} />
          </div>
        )
      })}
      {data?.last_sync && <div className="fp-sub">Last sent to Alphalist: {new Date(data.last_sync.created_at).toLocaleString()} ({data.last_sync.rows_added} lines)</div>}

      {edit && fields && <FormModal title={edit.id ? 'Edit line' : 'New line'} fields={fields} initial={edit} onSave={save} onClose={() => setEdit(null)} onBlurField={lookup}
        onChangeField={(name, v, patch) => name === 'tin' && String(v.tin).replace(/\D/g, '').length === 9 && lookup(name, v, patch)} idPrefix="qap-line" />}

      <Modal show={!!preview} onHide={() => setPreview(null)} size="xl">
        <Modal.Header closeButton><Modal.Title>{preview?.filename}</Modal.Title></Modal.Header>
        <Modal.Body>
          {preview?.empty && <Alert variant="warning">No lines for this period yet.</Alert>}
          {preview && <AnalysisView analysis={preview.analysis} />}
          <h5 className="mt-4">DAT contents</h5>
          <Card body className="bg-light"><pre className="mb-0" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{preview?.lines?.join('\n')}</pre></Card>
        </Modal.Body>
      </Modal>
      {sending && <SendDialog agentId={agentId} params={sending} label={label} onClose={() => setSending(null)} onSent={reload} />}
    </>
  )
}

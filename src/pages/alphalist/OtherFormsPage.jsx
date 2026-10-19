import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Button, Card, Form, Modal, Spinner, Table } from 'react-bootstrap'
import { PencilSquare, Plus, Trash } from 'react-bootstrap-icons'
import { formsApi, payeesApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import { agentName, payeeName, pad4, useAgents } from '../../components/AgentPicker'
import FormModal, { saveError } from '../../components/FormModal'
import { LoadError, SkeletonRows } from '../../components/Loading'
import PageHeader from '../../components/PageHeader'
import PeriodsWithLines, { usePeriodStats } from '../../components/PeriodsWithLines'
import Pager, { SearchBox } from '../../components/Pager'
import { findLines, pageOf } from '../../lib/pagedLines'
import BirValidation from '../../components/BirValidation'
import SendDialog from '../../components/SendDialog'
import SourceLink from '../../components/SourceLink'
import { confirmDialog } from '../../lib/confirm'
import { money } from '../../lib/money'
import { toast } from '../../lib/toast'
import useLoad from '../../lib/useLoad'
import { layout1604C, required1604C, Summary1604C, SummaryStrip1604C } from './Form1604C'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// What each Alphalist menu group shows per line in the table.
const GROUPS = {
  ANNUAL: { columns: [['gross_comp_income', 'Gross compensation'], ['net_taxable_comp_income', 'Net taxable'], ['tax_due', 'Tax due'], ['amt_wthld_dec', 'Withheld in Dec.']] },
  MAP: { columns: [['atc_code', 'ATC'], ['tax_rate', 'Rate'], ['income_payment', 'Income payment'], ['actual_amt_wthld', 'Tax withheld']] },
  SAWT: { columns: [['atc_code', 'ATC'], ['tax_rate', 'Rate'], ['income_payment', 'Income payment'], ['actual_amt_wthld', 'Tax withheld']] },
  QAP: { columns: [['date_death', 'Date of death'], ['date_wtheld', 'Date withheld'], ['income_payment', 'Withdrawn'], ['actual_amt_wthld', 'Tax withheld']] },
}
// SAWT forms by what they are, for the form picker (the API titles all read "SAWT - attached to BIR Form ...")
const SAWT_NAMES = {
  1700: 'Annual income tax, compensation earners', 1701: 'Annual income tax, individuals', '1701Q': 'Quarterly income tax, individuals',
  1702: 'Annual income tax, corporations', '1702Q': 'Quarterly income tax, corporations', '2550M': 'Monthly VAT', '2550Q': 'Quarterly VAT',
  '2551Q': 'Quarterly percentage tax', 2553: 'Percentage tax under special laws',
}
const formName = (f) => (f.group === 'SAWT' ? `BIR Form ${f.code} - ${SAWT_NAMES[f.code] ?? ''}` : f.title)
const plural = (n) => `${n} line${n === 1 ? '' : 's'}`
const isText = (f) => ['atc_code', 'date_death', 'date_wtheld'].includes(f)
const isMoney = (f) => !isText(f) && f !== 'tax_rate'
// /forms input types -> FormModal field types
const TYPES = { amount: 'amount', rate: 'rate', number: 'number', date: 'date' }

// 1604-C (employees), MAP 1600-VT/PT, SAWT and 1621: one screen, driven by GET /api/forms.
export default function OtherFormsPage({ group, title, sub }) {
  const { agents, id: agentId, agent, setId, loading: agentsLoading } = useAgents()
  const now = new Date()
  const [period, setPeriod] = useState({ form: '', year: now.getFullYear(), month: now.getMonth() + 1 })
  const [edit, setEdit] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState('') // 'preview' | 'download' while that button waits
  const [sending, setSending] = useState(null) // params of the open Send window
  const annual = group === 'ANNUAL'

  // A bill's or invoice's BIR link opens its line: ?form=2550M&year=2026&month=3
  const [search] = useSearchParams()
  const linked = useRef(!!(search.get('form') || search.get('month')))
  useEffect(() => {
    const year = Number(search.get('year'))
    const month = Number(search.get('month'))
    const patch = {
      ...(search.get('form') ? { form: search.get('form') } : {}),
      ...(year ? { year } : {}),
      ...(month >= 1 && month <= 12 ? { month } : {}),
    }
    if (Object.keys(patch).length) setPeriod((p) => ({ ...p, ...patch }))
    // ...and &agent= picks the document's withholding agent
    if (search.get('agent')) setId(search.get('agent'))
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const formsLoad = useLoad(() => formsApi.list().then((all) => all.filter((f) => f.group === group)), [group])
  const forms = useMemo(() => formsLoad.data ?? [], [formsLoad.data])
  useEffect(() => {
    if (forms.length) setPeriod((p) => ({ ...p, form: forms.some((f) => f.code === p.form) ? p.form : forms[0].code }))
  }, [forms])

  const form = forms.find((f) => f.code === period.form)
  const monthly = form?.frequency === 'monthly'
  const params = useMemo(() => (form ? { form: form.code, year: period.year, ...(monthly ? { month: period.month } : {}) } : null), [form, monthly, period.year, period.month])
  const periodLabel = `${monthly ? MONTHS[period.month - 1] + ' ' : ''}${period.year}`

  const lines = useLoad(() => agentId && params && formsApi.get(agentId, params), [agentId, params])

  // Which forms / months of the year have lines (GET /api/filing-status).
  const stats = usePeriodStats(agentId, period.year)
  const codes = useMemo(() => forms.map((f) => f.code), [forms])
  const refresh = () => { lines.reload(); stats.reload() }
  // Open on the latest period that has lines (once per company and year), unless a link chose the period.
  const autoPicked = useRef('')
  useEffect(() => {
    const key = `${agentId}-${period.year}`
    if (!stats.ready || !codes.length || !agentId || autoPicked.current === key) return
    autoPicked.current = key
    if (linked.current) { linked.current = false; return }
    const latest = stats.periods(codes)[0]
    if (latest) setPeriod((p) => ({ ...p, form: latest.pick.form, ...(latest.pick.month ? { month: latest.pick.month } : {}) }))
  }, [stats, codes, agentId, period.year])
  // Lines drawn 20 at a time per schedule, with a quick find (all of them still count in totals and sends).
  const [find, setFind] = useState('')
  const [pages, setPages] = useState({})
  useEffect(() => { setPages({}) }, [agentId, params, find])
  const pick = (to) => setPeriod((p) => ({ ...p, form: to.form, ...(to.month ? { month: to.month } : {}) }))
  const isCurrent = (to) => to.form === period.form && (!to.month || !monthly || to.month === period.month)
  const loading = agentsLoading || formsLoad.loading || lines.loading || (!!agentId && !form && forms.length > 0)

  const set = (k, v) => setPeriod((p) => ({ ...p, [k]: v }))

  // The modal's fields: payee, then each schedule's own inputs (shown for that schedule only).
  // 1604-C groups them into employee / present employer / previous employer.
  const fields = form && [
    { name: 'schedule', label: 'Schedule', col: 12, type: 'select', options: Object.entries(form.schedules).map(([k, s]) => [k, s.title]) },
    { name: 'tin', label: group === 'SAWT' ? "Withholding agent's TIN (9 digits)" : 'TIN (9 digits)', col: annual ? 8 : 4, required: true },
    { name: 'branch_code', label: 'Branch', col: 4 },
    { name: 'payee_type', label: 'Type', col: 4, type: 'select', options: [['I', 'Individual'], ['N', 'Non-individual']], show: () => !annual },
    { name: 'registered_name', label: group === 'QAP' ? 'Name of estate' : 'Registered name', col: 12, show: (v) => v.payee_type === 'N', required: true },
    { name: 'last_name', label: 'Last name', col: 4, show: (v) => v.payee_type !== 'N', required: true },
    { name: 'first_name', label: 'First name', col: 4, show: (v) => v.payee_type !== 'N' },
    { name: 'middle_name', label: 'Middle name', col: 4, show: (v) => v.payee_type !== 'N' },
  ].map((f) => (annual ? { ...f, section: 'Employee' } : f)).concat(
    Object.entries(form.schedules).flatMap(([sch, s]) => s.inputs.map((i) => ({
      key: `${sch}.${i.field}`,
      name: i.field,
      label: i.label,
      col: i.type === 'text' || i.type === 'date' || i.type === 'code' ? 4 : 6,
      show: (v) => v.schedule === sch,
      type: TYPES[i.type] ?? (i.type === 'code' || i.type === 'atc' ? 'select' : 'text'),
      ...(i.type === 'code' ? { options: [['', '-'], ...Object.entries(i.options)] } : {}),
      ...(i.type === 'atc' ? { options: [['', 'Select ATC'], ...form.atcs.map((a) => [a.code, `${a.code} - ${a.description ?? ''} (${a.rate}%)`])] } : {}),
      ...(annual ? { ...layout1604C(i.field, i.label), required: required1604C(sch).includes(i.field) } : {}),
      ...(i.field === 'nationality' ? { placeholder: 'e.g. FILIPINO' } : {}),
    }))),
  )
  const inputsOf = (sch) => form.schedules[sch].inputs.map((i) => i.field)

  // Typing a TIN fills in the name from the TIN library.
  const lookup = async (name, v, patch) => {
    if (name !== 'tin' && name !== 'branch_code') return
    if (String(v.tin || '').replace(/\D/g, '').length < 9) return
    const r = await payeesApi.lookup({ tin: v.tin, branch: v.branch_code }).catch(() => null)
    if (!r?.found) return
    const { registered_name, last_name, first_name, middle_name, payee_type, branch_code } = r.payee
    patch({ registered_name, last_name, first_name, middle_name, payee_type, branch_code })
  }

  const save = (v) => {
    const body = {
      schedule: v.schedule, tin: v.tin, branch_code: v.branch_code, payee_type: v.payee_type,
      registered_name: v.registered_name, last_name: v.last_name, first_name: v.first_name, middle_name: v.middle_name,
      values: Object.fromEntries(inputsOf(v.schedule).map((f) => [f, v[f] ?? ''])),
    }
    return (v.id ? formsApi.update(v.id, body) : formsApi.add(agentId, params, body))
      .then(() => { toast(v.id ? 'Line updated.' : `Line added to ${form.title.split(' - ')[0]}, ${periodLabel}.`); refresh() })
      .catch((e) => { throw saveError(e) })
  }
  const newLine = () => setEdit({
    schedule: Object.keys(form.schedules)[0], branch_code: '0000', payee_type: annual ? 'I' : 'N',
    // A 1604-C employee usually worked the whole year; Alphalist's own defaults for status, separation and filing.
    ...(annual ? { employment_from: `${period.year}-01-01`, employment_to: `${period.year}-12-31`, employment_status: 'R', reason_separation: 'NA', subs_filing: 'Y' } : {}),
  })
  const startEdit = (e) => setEdit({ ...e.payee, ...e.values, schedule: e.schedule, id: e.id })
  const remove = async (e) => {
    if (!await confirmDialog(`Remove the line for ${payeeName(e.payee)}? (It is archived and left out of DAT files and sends.)`, { ok: 'Remove', variant: 'danger' })) return
    try { await formsApi.remove(e.id); toast('Line removed.'); refresh() } catch (err) { setError(errorMessage(err)) }
  }
  const run = (what, p) => { setWorking(what); setError(''); return p.catch((e) => setError(errorMessage(e))).finally(() => setWorking('')) }

  const columns = GROUPS[group].columns
  const cols = columns.length + 4
  const ready = !!agentId && !!form
  const schedules = form ? Object.entries(form.schedules) : [['', { title: 'Loading…' }]]
  return (
    <>
      <PageHeader title={title} sub={sub} />
      <LoadError error={formsLoad.error || lines.error} onRetry={formsLoad.error ? formsLoad.reload : lines.reload} />
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {!agentsLoading && agents.length === 0 && <Alert variant="info">Add your company under <Link to="/alphalist/agents">Withholding Agents</Link> first.</Alert>}
      <div className="d-flex gap-2 flex-wrap mb-3">
        {forms.length > 1 && (
          <Form.Group controlId="of-form">
            <Form.Label visuallyHidden>Form</Form.Label>
            <Form.Select style={{ width: 'auto', maxWidth: '100%' }} value={period.form} onChange={(e) => set('form', e.target.value)}>
              {forms.map((f) => {
                const n = stats.count(f.code)
                return <option key={f.code} value={f.code}>{formName(f)}{n ? ` — ${plural(n)} in ${period.year}` : ''}</option>
              })}
            </Form.Select>
          </Form.Group>
        )}
        {monthly && (
          <Form.Group controlId="of-month">
            <Form.Label visuallyHidden>Month</Form.Label>
            <Form.Select style={{ width: 'auto' }} value={period.month} onChange={(e) => set('month', Number(e.target.value))}>
              {MONTHS.map((m, i) => {
                const n = form ? stats.count(form.code, i + 1) : 0
                return <option key={m} value={i + 1}>{m}{n ? ` — ${plural(n)}` : ''}</option>
              })}
            </Form.Select>
          </Form.Group>
        )}
        <Form.Group controlId="of-year">
          <Form.Label visuallyHidden>Year</Form.Label>
          <Form.Control type="number" min={2000} max={2099} style={{ width: 100 }} value={period.year} onChange={(e) => set('year', Number(e.target.value))} />
        </Form.Group>
        <div className="ms-auto d-flex gap-2 flex-wrap">
          <Button variant="light" disabled={!ready || !!working} onClick={() => run('preview', formsApi.preview(agentId, params).then(setPreview))}>
            {working === 'preview' && <Spinner size="sm" aria-hidden />} Preview DAT
          </Button>
          <Button variant="light" disabled={!ready || !!working} onClick={() => run('download', formsApi.download(agentId, params))}>
            {working === 'download' && <Spinner size="sm" aria-hidden />} Download DAT
          </Button>
          <Button variant="dark" disabled={!ready} onClick={() => setSending(params)}>Send to Alphalist</Button>
          <Button className="btn-fp" disabled={!ready || !lines.data} onClick={newLine}><Plus size={20} aria-hidden /> {annual ? 'New Employee' : 'New Line'}</Button>
        </div>
      </div>

      {agentId && forms.length > 0 && (
        <PeriodsWithLines stats={stats} codes={codes} year={period.year} isCurrent={isCurrent} onPick={pick}
          label={(p) => (annual ? p.label : `${group === 'SAWT' ? p.code : p.label} · ${p.period}`)} />
      )}

      <BirValidation agentId={agentId} agentTin={agent?.tin} period={params} version={lines.data} empty={!lines.data || lines.data.entries.length === 0} />

      {(lines.data?.entries.length ?? 0) > 20 && (
        <div className="mb-3"><SearchBox value={find} onSearch={setFind} placeholder={annual ? 'Find employee or TIN in these lines' : 'Find payee or TIN in these lines'} label="Find lines" delay={200} /></div>
      )}

      {schedules.map(([sch, s]) => {
        const all = lines.data?.entries.filter((e) => e.schedule === sch) ?? []
        const found = findLines(all, find)
        const { rows, offset, pagination } = pageOf(found, pages[sch])
        return (
          <div className="fp-card mb-3" key={sch}>
            <div className="p-3 fw-semibold border-bottom d-flex align-items-center gap-2">
              {s.title}{lines.loading && lines.data && <Spinner size="sm" className="text-muted" aria-label="Refreshing" />}
            </div>
            <Table responsive className={`mb-0 align-middle fp-stack ${lines.loading && lines.data ? 'fp-table-loading' : ''}`} aria-busy={loading}>
              <thead>
                <tr>
                  <th className="fp-hide-narrow">#</th><th className="fp-hide-narrow">TIN</th><th>Name</th>
                  {columns.map(([f, l]) => <th key={f} className={isMoney(f) ? 'fp-num' : undefined}>{l}</th>)}
                  <th className="fp-actions"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loading && !lines.data && <SkeletonRows cols={cols} hide={[0, 1]} />}
                {!loading && lines.data && all.length === 0 && <tr><td colSpan={cols} className="fp-empty">No lines for {agent ? agentName(agent) : 'this company'} in {periodLabel}.</td></tr>}
                {!loading && lines.data && all.length > 0 && found.length === 0 && <tr><td colSpan={cols} className="fp-empty">No lines match "{find}".</td></tr>}
                {rows.map((e, i) => (
                  <tr key={e.id}>
                    <td className="fp-hide-narrow">{offset + i + 1}</td>
                    <td className="fp-hide-narrow fp-tin">{e.payee?.tin}-{pad4(e.payee?.branch_code)}</td>
                    <td className="fp-name">{payeeName(e.payee)}<div className="d-lg-none small text-muted fp-tin">{e.payee?.tin}-{pad4(e.payee?.branch_code)}</div></td>
                    {columns.map(([f]) => <td key={f} className={isMoney(f) ? 'fp-num' : undefined}>{isMoney(f) ? money(e.values[f]) : e.values[f]}</td>)}
                    <td className="fp-actions">
                      {/* A line from an employee's compensation, a bill or an invoice is changed there (its next save rewrites the line). */}
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
              {all.length > 1 && lines.data?.totals?.[sch] && (
                <tfoot>
                  <tr className="fw-semibold">
                    <td className="fp-hide-narrow" /><td className="fp-hide-narrow" /><td>Total ({all.length.toLocaleString()}{find ? ' lines, all of them' : ''})</td>
                    {columns.map(([f]) => <td key={f} className={isMoney(f) ? 'fp-num' : undefined}>{isMoney(f) ? money(lines.data.totals[sch][f]) : ''}</td>)}
                    <td />
                  </tr>
                </tfoot>
              )}
            </Table>
            <Pager pagination={pagination} onPage={(p) => setPages((x) => ({ ...x, [sch]: p }))} noun={find ? 'matching lines' : 'lines'} />
          </div>
        )
      })}

      {edit && fields && (
        <FormModal title={edit.id ? (annual ? 'Edit employee' : 'Edit line') : (annual ? 'New employee' : 'New line')} fields={fields} initial={edit} onSave={save} onClose={() => setEdit(null)}
          onBlurField={lookup} onChangeField={(name, v, patch) => name === 'tin' && String(v.tin).replace(/\D/g, '').length === 9 && lookup(name, v, patch)}
          size={annual ? 'xl' : 'lg'} idPrefix={`line-${group.toLowerCase()}`}
          {...(annual ? { aside: (v) => <Summary1604C values={v} />, asideCompact: (v) => <SummaryStrip1604C values={v} /> } : {})} />
      )}

      <Modal show={!!preview} onHide={() => setPreview(null)} size="xl">
        <Modal.Header closeButton><Modal.Title>{preview?.filename}</Modal.Title></Modal.Header>
        <Modal.Body>
          {preview?.empty && <Alert variant="warning">No lines for this period yet.</Alert>}
          <Card body className="bg-light"><pre className="mb-0" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{preview?.lines?.join('\n')}</pre></Card>
        </Modal.Body>
      </Modal>
      {sending && <SendDialog agentId={agentId} params={sending} label={`${form?.title ?? ''}, ${periodLabel}`} onClose={() => setSending(null)} onSent={refresh} />}
    </>
  )
}

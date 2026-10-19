import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Badge, Button, Col, Form, Row, Table } from 'react-bootstrap'
import { BoxArrowUpRight, PencilSquare, PersonPlus, Plus, Trash } from 'react-bootstrap-icons'
import { compensationsApi, employeesApi, form1604cLink } from '../../lib/api/employees'
import { formsApi } from '../../lib/api/alphalist'
import { errorMessage } from '../../lib/api/client'
import useLoad from '../../lib/useLoad'
import { centsToAmount, money, toCents } from '../../lib/money'
import { toast } from '../../lib/toast'
import { confirmDialog } from '../../lib/confirm'
import { agentName, useAgents } from '../../components/AgentPicker'
import FormModal, { saveError } from '../../components/FormModal'
import PageHeader from '../../components/PageHeader'
import Pager, { SearchBox } from '../../components/Pager'
import { LoadError, SkeletonRows } from '../../components/Loading'
import { layout1604C, required1604C, Summary1604C, SummaryStrip1604C } from '../alphalist/Form1604C'

// 1604-C fields that come from the employee record, not from the year's compensation.
const EMPLOYEE_FIELDS = ['region_num', 'nationality', 'employment_from', 'employment_to', 'employment_status', 'reason_separation', 'subs_filing']
const date = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '')
const BLANK = { branch_code: '0000', nationality: 'FILIPINO', region_num: '', employment_status: 'R', is_mwe: '0', hire_date: '', separation_date: '', reason_separation: '', middle_name: '', tin: '' }

// Employees (alphalist-api /employees). Each year's compensation is the employee's line on the company's 1604-C:
// entered here once, computed by the API as Alphalist's 1604-C screens do, and sent to Alphalist from the 1604-C page.
export default function Employees() {
  const { agents, id: agentId, agent, loading: agentsLoading } = useAgents()
  const [year, setYear] = useState(new Date().getFullYear())
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(null)        // GET /forms 1604-C: code lists and the compensation inputs
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)  // employee being added / edited
  const [comp, setComp] = useState(null)        // { employee, initial } of the open compensation dialog
  const [msg, setMsg] = useState(null)

  // A 1604-C line's "From Employees" link opens its employee and year: ?employee=3&year=2026
  const [params] = useSearchParams()
  useEffect(() => {
    if (Number(params.get('employee'))) setSelectedId(Number(params.get('employee')))
    if (Number(params.get('year'))) setYear(Number(params.get('year')))
  }, [params])

  useEffect(() => {
    formsApi.list().then((all) => setForm(all.find((f) => f.code === '1604C') ?? null)).catch((e) => setMsg(errorMessage(e)))
  }, [])

  // One page of employees (20), searched on the server; the 1604-C summary is added up by the API over all of them.
  useEffect(() => { setPage(1) }, [agentId, query])
  const list = useLoad(() => agentId && employeesApi.page({ withholding_agent_id: agentId, page, search: query }), [agentId, page, query], { keep: true })
  const employees = useMemo(() => list.data?.rows ?? [], [list.data])
  const headcount = useLoad(() => agentId && employeesApi.page({ withholding_agent_id: agentId, per_page: 1 }), [agentId])
  const totals = useLoad(() => agentId && employeesApi.totals1604C(agentId, year), [agentId, year])
  const refresh = () => { list.reload(); headcount.reload(); totals.reload() }
  // A "From Employees" link may point at someone who is not on this page: load them directly.
  const [pinned, setPinned] = useState(null)
  useEffect(() => {
    if (!selectedId || !list.data || employees.some((e) => e.id === selectedId) || pinned?.id === selectedId) return
    employeesApi.get(selectedId).then(setPinned).catch(() => {})
  }, [selectedId, list.data]) // eslint-disable-line react-hooks/exhaustive-deps
  const options = (field) => Object.entries(form?.schedules.D1.inputs.find((i) => i.field === field)?.options ?? {})
  const statusLabel = (code) => options('employment_status').find(([k]) => k === code)?.[1] ?? code
  const compOf = (e) => e?.compensations?.find((c) => c.year === Number(year)) ?? null

  const shown = employees
  const selected = shown.find((e) => e.id === selectedId) ?? (pinned?.id === selectedId ? pinned : null) ?? shown[0] ?? null

  // The company's 1604-C for the year, over every employee (Schedule 1 + Schedule 2).
  const t = totals.data
  const linesEntered = t ? Object.values(t.counts).reduce((n, c) => n + c, 0) : 0
  const allEmployees = headcount.data?.pagination?.total ?? 0
  const total = (f) => centsToAmount(Object.values(t?.totals ?? {}).reduce((sum, sch) => sum + toCents(sch[f]), 0))

  // ---------------------------------------------------------------- employee dialog
  const employeeFields = form && [
    { name: 'withholding_agent_id', label: 'Employer (withholding agent)', type: 'select', col: 12, section: 'Employee', required: true,
      options: agents.map((a) => [String(a.id), `${agentName(a)} (${a.tin})`]) },
    { name: 'last_name', label: 'Last name', col: 4, section: 'Employee', required: true },
    { name: 'first_name', label: 'First name', col: 4, section: 'Employee', required: true },
    { name: 'middle_name', label: 'Middle name', col: 4, section: 'Employee' },
    { name: 'tin', label: 'TIN', col: 5, section: 'Employee', placeholder: '000-000-000', help: 'Needed for the 1604-C. Added to the TIN library.' },
    { name: 'branch_code', label: 'Branch', col: 3, section: 'Employee' },
    { name: 'nationality', label: 'Nationality', col: 4, section: 'Employee', required: true },
    { name: 'region_num', label: 'Region (place of work)', type: 'select', col: 4, section: 'Employment', required: true, options: [['', 'Select region'], ...options('region_num')] },
    { name: 'employment_status', label: 'Employment status', type: 'select', col: 4, section: 'Employment', options: options('employment_status') },
    { name: 'is_mwe', label: 'Minimum wage earner', type: 'select', col: 4, section: 'Employment', options: [['0', 'No (Schedule 1)'], ['1', 'Yes (Schedule 2)']],
      help: 'Used for new years; each year can be changed in its 1604-C.' },
    { name: 'hire_date', label: 'Hired', type: 'date', col: 4, section: 'Employment', required: true },
    { name: 'separation_date', label: 'Separated', type: 'date', col: 4, section: 'Employment', help: 'Leave blank while employed.' },
    { name: 'reason_separation', label: 'Reason of separation', type: 'select', col: 4, section: 'Employment', required: true, show: (v) => !!v.separation_date,
      options: [['', 'Select reason'], ...options('reason_separation').filter(([k]) => k !== 'NA')] },
  ]

  const openEmployee = (e) => setEditing(e
    ? { ...BLANK, ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, e[k] ?? ''])), id: e.id, withholding_agent_id: String(e.withholding_agent_id),
      last_name: e.last_name, first_name: e.first_name, is_mwe: e.is_mwe ? '1' : '0', reason_separation: e.reason_separation === 'NA' ? '' : e.reason_separation }
    : { ...BLANK, withholding_agent_id: String(agentId) })

  const saveEmployee = async (v) => {
    try {
      const { record, message } = await employeesApi.save({ ...v, is_mwe: v.is_mwe === '1', separation_date: v.separation_date || null, reason_separation: v.separation_date ? v.reason_separation : 'NA' })
      toast(message)
      setSelectedId(record.id)
      if (String(record.withholding_agent_id) !== String(agentId)) toast(`${record.name} works for another company: pick it in the top bar to see them.`, 'info')
      refresh()
    } catch (e) { throw saveError(e) }
  }

  const removeEmployee = async (e) => {
    const years = (e.compensations ?? []).map((c) => c.year).join(', ')
    if (!await confirmDialog(`Archive ${e.name}?${years ? `\nTheir 1604-C lines (${years}) are removed too.` : ''}`, { ok: 'Archive', variant: 'danger' })) return
    try { toast((await employeesApi.remove(e.id)).message); refresh() } catch (err) { setMsg(errorMessage(err)) }
  }

  // ---------------------------------------------------------------- 1604-C compensation dialog
  const employmentNote = (e) => {
    if (!e) return ''
    const from = e.hire_date > `${year}-01-01` ? e.hire_date : `${year}-01-01`
    const to = e.separation_date && e.separation_date < `${year}-12-31` ? e.separation_date : `${year}-12-31`
    return `From ${e.name}'s record: region ${e.region_num}, ${statusLabel(e.employment_status).toLowerCase()}, employed ${date(from)} – ${date(to)}.`
  }
  const compFields = form && comp && [
    { name: 'schedule', label: 'Schedule', type: 'select', col: 8, section: 'Return', options: Object.entries(form.schedules).map(([k, s]) => [k, s.title]), help: employmentNote(comp.employee) },
    { name: 'subs_filing', label: 'Substituted filing', type: 'select', col: 4, section: 'Return', options: [['', 'Auto (no if previous employer)'], ...options('subs_filing')] },
    ...Object.entries(form.schedules).flatMap(([sch, s]) => s.inputs.filter((i) => !EMPLOYEE_FIELDS.includes(i.field)).map((i) => ({
      key: `${sch}.${i.field}`,
      name: i.field,
      col: 6,
      type: i.type === 'number' ? 'number' : 'amount',
      show: (v) => v.schedule === sch,
      ...layout1604C(i.field, i.label),
      required: required1604C(sch).includes(i.field),
    }))),
  ]

  const openComp = (e) => {
    const c = compOf(e)
    setComp({ employee: e, initial: c ? { id: c.id, schedule: c.schedule, subs_filing: c.subs_filing, ...c.amounts } : { schedule: e.is_mwe ? 'D2' : 'D1', subs_filing: '' } })
  }

  const saveComp = async (v) => {
    const inputs = form.schedules[v.schedule].inputs.map((i) => i.field).filter((f) => !EMPLOYEE_FIELDS.includes(f))
    try {
      const { message } = await compensationsApi.save({
        id: v.id, employee_id: comp.employee.id, year: Number(year), is_mwe: v.schedule === 'D2', subs_filing: v.subs_filing || null,
        amounts: Object.fromEntries(inputs.map((f) => [f, v[f] ?? ''])),
      })
      toast(message)
      refresh()
    } catch (e) {
      const err = saveError(e)
      err.fields = Object.fromEntries(Object.entries(err.fields).map(([k, m]) => [k.replace(/^amounts\./, ''), m]))
      throw err
    }
  }

  const removeComp = async (e, c) => {
    if (!await confirmDialog(`Remove ${e.name}'s ${c.year} compensation?\nTheir line is taken off the ${c.year} 1604-C.`, { ok: 'Remove', variant: 'danger' })) return
    try { toast((await compensationsApi.remove(c.id)).message); refresh() } catch (err) { setMsg(errorMessage(err)) }
  }

  const loading = agentsLoading || (list.loading && !list.data)
  const cols = 8
  return (
    <>
      <PageHeader title="Employees" sub={`${agent ? `Employees of ${agentName(agent)}. ` : ''}Each year's compensation is the employee's line on the BIR 1604-C (alphalist of employees), with the tax due worked out.`}>
        <SearchBox value={query} onSearch={setQuery} placeholder="Search name or TIN" label="Search employees" style={{ width: 200 }} />
        <Form.Group className="d-flex align-items-center gap-2" controlId="emp-year">
          <Form.Label className="mb-0 small fw-semibold text-nowrap">1604-C year</Form.Label>
          <Form.Control type="number" style={{ width: 100 }} value={year} onChange={(e) => setYear(Number(e.target.value) || year)} />
        </Form.Group>
        <Button className="btn-fp d-flex align-items-center gap-2" disabled={!agentId || !form} onClick={() => openEmployee(null)}><PersonPlus aria-hidden /> New Employee</Button>
      </PageHeader>

      {msg && <Alert variant="danger" dismissible onClose={() => setMsg(null)}>{msg}</Alert>}
      <LoadError error={list.error} onRetry={list.reload} />
      {!agentsLoading && agents.length === 0 && (
        <Alert variant="info">Add your company first: <Link to="/alphalist/agents">Alphalist &gt; Withholding Agents</Link>. Employees belong to the company that files their 1604-C.</Alert>
      )}

      {agentId && (
        <div className="fp-card mb-3 p-3 d-flex align-items-center gap-3 flex-wrap">
          <span className="fw-semibold">1604-C {year}</span>
          <span className="fp-sub">{linesEntered.toLocaleString()} of {allEmployees.toLocaleString()} employee{allEmployees === 1 ? '' : 's'} entered</span>
          <span>Tax due <span className="fp-num fw-semibold">₱{total('tax_due')}</span></span>
          <span>To withhold in December <span className="fp-num fw-semibold">₱{total('amt_wthld_dec')}</span></span>
          {toCents(total('over_wthld')) > 0 && <span>Over-withheld <span className="fp-num fw-semibold text-success">₱{total('over_wthld')}</span></span>}
          <Link className="btn btn-sm btn-light ms-auto d-flex align-items-center gap-2" to={`/alphalist/1604c?agent=${agentId}&year=${year}`}>Open the 1604-C <BoxArrowUpRight aria-hidden /></Link>
        </div>
      )}

      <Row className="g-3">
        <Col lg={8}>
          <div className="fp-card">
            <Table responsive hover className={`mb-0 align-middle fp-stack ${list.loading && list.data ? 'fp-table-loading' : ''}`} aria-busy={loading}>
              <thead>
                <tr>
                  <th className="fp-hide-narrow">#</th><th>Name</th><th className="fp-hide-narrow">TIN</th><th className="fp-hide-narrow">Region</th>
                  <th className="fp-hide-narrow">Hired</th><th className="fp-num">Tax due {year}</th><th className="fp-num fp-hide-narrow">December</th>
                  <th className="fp-actions"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonRows cols={cols} hide={[0, 2, 3, 4, 6]} />}
                {!loading && list.data && shown.length === 0 && (
                  <tr><td colSpan={cols} className="fp-empty">{query ? `No employees match "${query}".` : `No employees for ${agent ? agentName(agent) : 'this company'} yet.`}</td></tr>
                )}
                {shown.map((e, i) => {
                  const c = compOf(e)
                  const v = c?.form_entry?.values
                  return (
                    <tr key={e.id} className={selected?.id === e.id ? 'table-active' : undefined} onClick={() => setSelectedId(e.id)} style={{ cursor: 'pointer' }}>
                      <td className="fp-hide-narrow">{((list.data?.pagination?.current_page ?? 1) - 1) * (list.data?.pagination?.per_page ?? 0) + i + 1}</td>
                      <td className="fp-name">
                        <Button variant="link" className="p-0 text-start fw-semibold text-decoration-none" onClick={() => setSelectedId(e.id)}>{e.name}</Button>
                        {e.is_mwe && <Badge bg="light" text="dark" className="ms-2">MWE</Badge>}
                        {e.separation_date && <Badge bg="secondary" className="ms-2">left {date(e.separation_date)}</Badge>}
                        <div className="small text-muted">{statusLabel(e.employment_status)}<span className="d-lg-none fp-tin"> · {e.formatted_tin}</span></div>
                      </td>
                      <td className="fp-hide-narrow fp-tin">{e.formatted_tin || <span className="text-muted">no TIN</span>}</td>
                      <td className="fp-hide-narrow">{e.region_num}</td>
                      <td className="fp-hide-narrow text-nowrap">{date(e.hire_date)}</td>
                      <td className="fp-num">{v ? money(v.tax_due) : <span className="text-muted">—</span>}</td>
                      <td className="fp-num fp-hide-narrow">
                        {v && Number(v.over_wthld) > 0 ? <span className="text-success">{money(v.over_wthld)} refund</span> : v ? money(v.amt_wthld_dec) : ''}
                      </td>
                      <td className="fp-actions" onClick={(ev) => ev.stopPropagation()}>
                        <Button size="sm" variant="light" onClick={() => openEmployee(e)} aria-label={`Edit ${e.name}`} title="Edit employee"><PencilSquare aria-hidden /></Button>{' '}
                        <Button size="sm" variant="outline-danger" onClick={() => removeEmployee(e)} aria-label={`Archive ${e.name}`} title="Archive employee"><Trash aria-hidden /></Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
            <Pager pagination={list.data?.pagination} onPage={setPage} noun="employees" />
          </div>
        </Col>
        <Col lg={4}>
          <CompensationPanel employee={selected} year={year} comp={compOf(selected)} onEdit={() => openComp(selected)} onRemove={() => removeComp(selected, compOf(selected))} />
        </Col>
      </Row>

      {editing && employeeFields && (
        <FormModal title={editing.id ? `Edit ${editing.last_name}, ${editing.first_name}` : 'New employee'} fields={employeeFields} initial={editing}
          onSave={saveEmployee} onClose={() => setEditing(null)} idPrefix="emp" />
      )}
      {comp && compFields && (
        <FormModal title={`1604-C ${year} · ${comp.employee.name}`} fields={compFields} initial={comp.initial} onSave={saveComp} onClose={() => setComp(null)}
          size="xl" aside={(v) => <Summary1604C values={v} />} asideCompact={(v) => <SummaryStrip1604C values={v} />} idPrefix="comp" />
      )}
    </>
  )
}

const Line = ({ label, value, className = '' }) => <><dt className={className}>{label}</dt><dd className={className}>{value}</dd></>

// The selected employee's 1604-C for the year, as the API computed and stored it.
function CompensationPanel({ employee, year, comp, onEdit, onRemove }) {
  if (!employee) {
    return <div className="fp-summary"><div className="fw-semibold mb-1">1604-C {year}</div><div className="fp-sub small">Add an employee, then enter their compensation for {year}.</div></div>
  }
  const v = comp?.form_entry?.values
  const link = form1604cLink(comp?.alphalist_line)
  const peso = (f) => `₱${money(v?.[f] || 0)}`
  const refund = v && Number(v.over_wthld) > 0
  return (
    <div className="fp-summary" aria-live="polite">
      <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
        <div><div className="fw-semibold">1604-C {year}</div><div className="fp-sub small">{employee.name}</div></div>
        {comp && <Badge bg="light" text="dark">Schedule {comp.schedule.slice(1)}{comp.schedule === 'D2' ? ' · MWE' : ''}</Badge>}
      </div>
      {!v ? (
        <>
          <p className="fp-sub small">No compensation for {year} yet. Enter it once: it becomes {employee.first_name}&apos;s line on the {year} 1604-C, with the tax due worked out as Alphalist does.</p>
          <Button className="btn-fp d-flex align-items-center gap-2" onClick={onEdit} disabled={!employee.tin} title={employee.tin ? undefined : 'Add the TIN first'}><Plus aria-hidden /> Enter {year} compensation</Button>
          {!employee.tin && <div className="small text-danger mt-2">Add {employee.first_name}&apos;s TIN first (Edit employee): the 1604-C line needs it.</div>}
        </>
      ) : (
        <>
          <dl>
            <Line label="Employed" value={`${date(v.employment_from)} – ${date(v.employment_to)}`} />
            {comp.schedule === 'D2' && <Line label="Basic SMW per year" value={peso('pres_nontax_basic_smw_year')} />}
            <Line label="Non-taxable (present + previous)" value={`₱${centsToAmount(toCents(v.pres_total_nontax_comp_income) + toCents(v.prev_total_nontax_comp_income))}`} />
            <Line label="Gross taxable compensation" value={peso('gross_comp_income')} />
            <Line label="Net taxable compensation" value={peso('net_taxable_comp_income')} className="fp-total" />
            <Line label="Tax due" value={peso('tax_due')} />
            <Line label="Withheld Jan–Nov" value={peso('pres_tax_wthld')} />
            {Number(v.prev_tax_wthld) > 0 && <Line label="Withheld by previous employer" value={peso('prev_tax_wthld')} />}
            <Line label="Amount to withhold in December" value={peso('amt_wthld_dec')} className={`fp-total ${!refund && Number(v.amt_wthld_dec) > 0 ? 'text-danger' : ''}`} />
            <Line label="Over-withheld (refund to employee)" value={peso('over_wthld')} className={refund ? 'text-success fw-semibold' : ''} />
            <Line label="Substituted filing" value={v.subs_filing === 'Y' ? 'Yes' : 'No'} />
          </dl>
          <div className="d-flex gap-2 flex-wrap mt-3">
            <Button size="sm" className="btn-fp d-flex align-items-center gap-1" onClick={onEdit}><PencilSquare aria-hidden /> Edit</Button>
            <Button size="sm" variant="outline-danger" onClick={onRemove}>Remove</Button>
            {link && <Link className="btn btn-sm btn-light ms-auto d-flex align-items-center gap-1" to={link}>Open on 1604-C <BoxArrowUpRight aria-hidden /></Link>}
          </div>
        </>
      )}
    </div>
  )
}

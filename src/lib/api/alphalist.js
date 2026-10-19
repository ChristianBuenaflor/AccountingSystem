// Adapter between the FinancePro Alphalist screens and alphalist-api (../../alphalist-api).
// The API follows the HRIS conventions: { isSuccess, message, ... }, POST create/… / update/…/{id} / …/{id}/archive,
// lists answer 404 when empty. Each function returns the shape the screens already use.
import api, { downloadFile } from './client'
import { saveSession, logout as clearSession } from '../store/auth.js'

const data = (p) => p.then((r) => r.data)
// A list endpoint that answers 404 when there is nothing yet.
const listOr = (p, empty) => p.then((r) => r.data).catch((e) => { if (e.response?.status === 404) return empty; throw e })

// ---------------------------------------------------------------- auth
export const authApi = {
  login: async (login, password) => saveSession(await data(api.post('/login', { login, password }))),
  logout: async () => { try { await api.post('/logout') } catch { /* token may be gone already */ } clearSession() },
}

// ---------------------------------------------------------------- withholding agents
export const agentsApi = {
  list: () => listOr(api.get('/withholding-agents', { params: { per_page: 500 } }), { withholding_agents: [] }).then((d) => d.withholding_agents),
  rdos: () => data(api.get('/dropdown/rdos')).then((d) => d.data.map((r) => ({ code: r.code, name: r.description }))),
  save: (a) => data(a.id ? api.post(`/update/withholding-agents/${a.id}`, a) : api.post('/create/withholding-agents', a)).then((d) => d.withholding_agent),
  remove: (id) => api.post(`/withholding-agents/${id}/archive`),
}

// ---------------------------------------------------------------- payees (TIN library)
export const payeesApi = {
  list: (q, page = 1) => listOr(api.get('/payees', { params: { search: q || undefined, page, per_page: 20 } }), { payees: [], pagination: { last_page: 1 } })
    .then((d) => ({ data: d.payees, last_page: d.pagination?.last_page ?? 1, pagination: d.pagination ?? null })),
  save: (p) => data(p.id ? api.post(`/update/payees/${p.id}`, p) : api.post('/create/payees', p)).then((d) => d.payee),
  remove: (id) => api.post(`/payees/${id}/archive`),
  // { tin, branch, agent, form } -> { found, payee, last: { schedule, atc_code, tax_rate } }
  lookup: ({ tin, branch, agent, form }) =>
    api.get('/payees/lookup', { params: { tin, branch_code: branch, withholding_agent_id: agent, form_type: form } })
      .then((r) => ({ found: true, payee: r.data.payee, last: r.data.last_entry }))
      .catch((e) => { if ([404, 422].includes(e.response?.status)) return { found: false }; throw e }),
}

// ---------------------------------------------------------------- Alphalist status (shape used by the screens)
const status = () => data(api.get('/alphalist/status')).then(({ alphalist: a }) => ({
  found: a.found,
  path: a.path,
  locked: a.is_open,
  agent: a.registered_agent,
  error: a.error,
}))

const lastSync = (agent, form) => listOr(api.get('/alphalist/syncs', { params: { withholding_agent_id: agent, per_page: 50 } }), { syncs: [] })
  .then((d) => d.syncs.find((s) => !form || s.form_type === form) ?? null)

// DatReport (API) -> the analysis object AnalysisView renders
const toAnalysis = (check) => ({
  issues: check.issues,
  summary: check.summary,
  parsed: {
    encoding: check.encoding,
    line_ending: check.line_ending,
    lines: check.lines.map((l) => ({ number: l.number, key: l.record, title: l.title, columns: l.columns })),
  },
})

const datPreview = (d) => ({
  filename: d.dat.filename,
  lines: d.dat.lines,
  empty: d.dat.is_empty,
  schedules: d.dat.schedules,
  analysis: toAnalysis(d.check),
})

// ---------------------------------------------------------------- QAP (period = { form: '1601EQ' | '1601FQ', year, quarter })
const qapParams = (agent, period) => ({ withholding_agent_id: agent, form_type: period.form, year: period.year, quarter: period.quarter })

export const qapApi = {
  // -> { schedules: {D1: title}, entries: {D1: [...]}, atcs, alphalist, last_sync }
  get: async (agent, period) => {
    const [qap, atcs, alphalist, last] = await Promise.all([
      data(api.get('/qap-entries', { params: qapParams(agent, period) })),
      data(api.get('/dropdown/atcs', { params: { form_type: period.form } })).then((d) => d.data),
      status().catch(() => null),
      lastSync(agent, period.form).catch(() => null),
    ])
    return {
      schedules: Object.fromEntries(qap.schedules.map((s) => [s.schedule, s.title])),
      entries: Object.fromEntries(qap.schedules.map((s) => [s.schedule, s.entries])),
      totals: Object.fromEntries(qap.schedules.map((s) => [s.schedule, s.totals])),
      return_period: qap.return_period,
      atcs,
      alphalist,
      last_sync: last && last.return_period?.slice(0, 7) === `${period.year}-${String(period.quarter * 3).padStart(2, '0')}` ? last : null,
    }
  },
  add: (agent, period, body) => data(api.post('/create/qap-entries', { ...body, ...qapParams(agent, period) })),
  update: (agent, period, id, body) => data(api.post(`/update/qap-entries/${id}`, body)),
  remove: (agent, id) => api.post(`/qap-entries/${id}/archive`),
  preview: (agent, period) => data(api.get('/dat/qap', { params: qapParams(agent, period) })).then(datPreview),
  download: (agent, period) => downloadFile('/dat/qap/download', qapParams(agent, period), 'qap.DAT'),
  import: (agent, period, file) => {
    const body = new FormData()
    Object.entries(qapParams(agent, period)).forEach(([k, v]) => body.append(k, v))
    body.append('file', file)
    return data(api.post('/import/qap-entries', body))
  },
  downloadTemplate: () => downloadFile('/qap-entries/import-template', {}, 'qap-import-template.csv'),
}

// ---------------------------------------------------------------- annual 1604-F / 1604-E (opts = { form, year, variant, amended, sheets })
const annualPath = (form) => (form === '1604E' ? '/dat/1604e' : '/dat/1604f')
const annualParams = (agent, opts) => ({
  withholding_agent_id: agent,
  year: opts.year,
  ...(opts.form === '1604E' ? {} : { variant: opts.variant, amended: opts.amended ? 1 : 0, sheets: opts.sheets || 0 }),
})

export const annualApi = {
  get: async (agent, opts) => {
    const form = opts.form || '1604F'
    const [dat, alphalist, last] = await Promise.all([
      data(api.get(annualPath(form), { params: annualParams(agent, { ...opts, form }) })),
      status().catch(() => null),
      lastSync(agent, form).catch(() => null),
    ])
    return {
      ...datPreview(dat),
      year: opts.year,
      alphalist,
      last_sync: last && String(last.return_period).startsWith(String(opts.year)) ? last : null,
    }
  },
  download: (agent, opts) => downloadFile(`${annualPath(opts.form)}/download`, annualParams(agent, opts), `${opts.form || '1604F'}.DAT`),
}

// ---------------------------------------------------------------- BIR Alphalist on this PC
export const alphalistApi = {
  status,
  // body = { form, year, quarter?, month? } -> { form_type, return_period, lines_to_add, lines_by_schedule, lines_to_replace, agent_action, registered_agent, can_send }
  sendPreview: (agent, body) => data(api.get('/alphalist/send-preview', { params: {
    withholding_agent_id: agent, form_type: body.form, year: body.year, ...(body.quarter ? { quarter: body.quarter } : {}), ...(body.month ? { month: body.month } : {}),
  } })).then((d) => d.preview),
  setPath: (path) => data(api.post('/alphalist/path', { path })).then((d) => d.alphalist),
  browse: (dir) => data(api.get('/alphalist/browse', { params: dir ? { dir } : {} })).then((d) => d.browse),
  // -> { status, backups: [{name, created(unix)}], syncs }
  overview: async () => {
    const [st, backups, syncs] = await Promise.all([
      status(),
      listOr(api.get('/alphalist/backups'), { backups: [] }).then((d) => d.backups.map((b) => ({ name: b.name, path: b.path, created: Date.parse(b.created_at) / 1000 }))),
      listOr(api.get('/alphalist/syncs', { params: { per_page: 30 } }), { syncs: [] }).then((d) => d.syncs),
    ])
    return { status: st, backups, syncs }
  },
  // body = { form, year, quarter? } -> { log, period, where }
  send: (agent, body) => data(api.post('/alphalist/send', {
    withholding_agent_id: agent, form_type: body.form, year: body.year, ...(body.quarter ? { quarter: body.quarter } : {}), ...(body.month ? { month: body.month } : {}),
  })).then((d) => ({ log: d.sync, period: String(d.sync.return_period).slice(0, 10), where: d.open_in_alphalist, message: d.message })),
  restore: (backup) => data(api.post('/alphalist/restore', { backup })),
  removeAgent: () => data(api.post('/alphalist/remove-agent')),
  uploadPreview: (file) => {
    const body = new FormData()
    body.append('file', file)
    return data(api.post('/alphalist/upload-preview', body)).then((d) => d.preview)
  },
  upload: (file) => {
    const body = new FormData()
    body.append('file', file)
    return data(api.post('/alphalist/upload-dat', body))
  },
}

// ---------------------------------------------------------------- other forms (1604-C, MAP 1600-VT/PT, SAWT, 1621)
// period = { form, year, month? } (monthly forms need month)
const formParams = (agent, period) => ({ withholding_agent_id: agent, form_type: period.form, year: period.year, ...(period.month ? { month: period.month } : {}) })
let formsCache
export const formsApi = {
  // -> [{ code, title, frequency, group, schedules: { D1: { title, inputs: [{field,label,type,options}], totals } }, atcs }]
  list: () => (formsCache ??= data(api.get('/forms')).then((d) => d.forms).catch((e) => { formsCache = null; throw e })),
  // -> { entries, totals, return_period }
  get: (agent, period) => data(api.get('/form-entries', { params: formParams(agent, period) }))
    .then((d) => ({ entries: d.form_entries, totals: d.totals, return_period: d.return_period })),
  add: (agent, period, body) => data(api.post('/create/form-entries', { ...body, ...formParams(agent, period) })),
  update: (id, body) => data(api.post(`/update/form-entries/${id}`, body)),
  remove: (id) => api.post(`/form-entries/${id}/archive`),
  preview: (agent, period) => data(api.get('/dat/form', { params: formParams(agent, period) })).then((d) => ({ filename: d.dat.filename, lines: d.dat.lines, empty: d.dat.is_empty })),
  download: (agent, period) => downloadFile('/dat/form/download', formParams(agent, period), 'form.DAT'),
}

// ---------------------------------------------------------------- BIR validation (BIR's Alphalist Validation module, run on the DAT)
// period = { form, year, quarter? | month?, variant?, amended?, sheets? } (variant & co: 1604-F's layout choices)
const validationParams = (agent, p) => ({
  withholding_agent_id: agent, form_type: p.form, year: p.year,
  ...(p.quarter ? { quarter: p.quarter } : {}), ...(p.month ? { month: p.month } : {}),
  ...(p.variant ? { variant: p.variant, amended: p.amended ? 1 : 0, sheets: p.sheets || 0 } : {}),
})
export const validationApi = {
  // -> { passed, errors: [{ line, schedule, message, record }], messages, report, validated_filename, saves_as, line_count, is_empty, return_period }
  get: (agent, period) => data(api.get('/bir-validation', { params: validationParams(agent, period) })).then((d) => d.validation),
  // file: 'validated' (with BIR's validation key, for e-submission) | 'report' (the module's error report)
  download: (agent, period, file = 'validated') =>
    downloadFile('/bir-validation/download', { ...validationParams(agent, period), file }, file === 'report' ? 'validation-report.TXT' : 'validated.DAT'),
  // Any .DAT, e.g. one BIR Alphalist made: form, TIN and period come from its first line unless given.
  upload: (file, extra = {}) => {
    const body = new FormData()
    body.append('file', file)
    Object.entries(extra).forEach(([k, v]) => v !== undefined && v !== '' && body.append(k, v))
    return data(api.post('/tools/bir-validate', body)).then((d) => d.validation)
  },
  uploadDownload: async (file, which, extra = {}) => {
    const body = new FormData()
    body.append('file', file)
    body.append('download', which)
    Object.entries(extra).forEach(([k, v]) => v !== undefined && v !== '' && body.append(k, v))
    const res = await api.post('/tools/bir-validate', body, { responseType: 'blob' })
    const name = res.headers['x-dat-filename'] || (which === 'report' ? 'validation-report.TXT' : 'validated.DAT')
    const href = URL.createObjectURL(res.data)
    const a = Object.assign(document.createElement('a'), { href, download: name })
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(href)
  },
}

// ---------------------------------------------------------------- BIR filing status (every return and period of a year)
export const filingApi = {
  // -> { year, as_of, summary: { empty, has_lines, overdue, sent, changed }, returns: [{ code, label, title, group, cadence, due_rule, built_from,
  //      periods: [{ key, label, quarter, month, return_period, expected, lines, income, tax_withheld, due_date, days_until_due,
  //                  last_sent: { sent_at, rows_added } | null, last_changed_at, changed_since_send, status, link: { form, year, quarter? | month? } }] }] }
  get: (agent, year) => data(api.get('/filing-status', { params: { withholding_agent_id: agent, year } })),
}

// ---------------------------------------------------------------- DAT tools
const upload = (url, files) => {
  const body = new FormData()
  Object.entries(files).forEach(([k, f]) => body.append(k, f))
  return data(api.post(url, body))
}

let specCache
export const toolsApi = {
  // -> { filename, analysis }
  analyze: (dat) => upload('/tools/analyze-dat', { file: dat }).then((d) => ({ filename: d.filename, analysis: toAnalysis(d) })),
  // -> { byte_identical, identical, notes, lines }
  compare: (expected, actual) => upload('/tools/compare-dat', { expected, actual }),
  // -> { 'D1:1601EQ': { title, fields: [[name, type, label]], optional: [...] } }
  spec: () => (specCache ??= data(api.get('/tools/dat-spec')).then((d) => Object.fromEntries(d.layouts.map((l) => [l.record, {
    title: l.title,
    fields: l.fields.map((f) => [f.name, f.type, f.label]),
    optional: l.optional_fields.map((f) => [f.name, f.type, f.label]),
  }])))),
}

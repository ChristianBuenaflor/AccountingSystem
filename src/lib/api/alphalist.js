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
  list: (q, page = 1) => listOr(api.get('/payees', { params: { search: q || undefined, page, per_page: 50 } }), { payees: [], pagination: { last_page: 1 } })
    .then((d) => ({ data: d.payees, last_page: d.pagination?.last_page ?? 1 })),
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
    withholding_agent_id: agent, form_type: body.form, year: body.year, ...(body.quarter ? { quarter: body.quarter } : {}),
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

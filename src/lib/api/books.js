// Adapter between FinancePro's Sales / Purchases screens and alphalist-api (../../alphalist-api).
// Suppliers + bills / purchase orders, customers + invoices / quotes / orders. A bill with tax withheld
// creates its QAP 1601-EQ (or MAP 1600-VT/PT) line, an invoice with the customer's 2307 its SAWT line:
// the API answers with `alphalist_line` ({ form_type, year, quarter|month, entry_id }) and a `message` saying where.
import api from './client'
import { formsApi } from './alphalist'

const data = (p) => p.then((r) => r.data)
// List endpoints answer 404 when there is nothing yet.
const listOr = (p, key) => p.then((r) => r.data[key]).catch((e) => { if (e.response?.status === 404) return []; throw e })

const EMPTY_PAGE = (per) => ({ rows: [], pagination: { current_page: 1, last_page: 1, per_page: per, total: 0 } })

const crud = (path, key) => ({
  // First 500 only: for small lookups. Screens listing records use page().
  list: (params = {}) => listOr(api.get(`/${path}`, { params: { per_page: 500, ...params } }), key),
  // One page, searched on the server: { rows, pagination: { current_page, last_page, per_page, total } }
  page: (params = {}) => {
    const per = params.per_page ?? 20
    return api.get(`/${path}`, { params: { ...params, per_page: per, search: params.search || undefined } })
      .then((r) => ({ rows: r.data[key], pagination: r.data.pagination }))
      .catch((e) => { if (e.response?.status === 404) return EMPTY_PAGE(per); throw e })
  },
  get: (id) => data(api.get(`/${path}/${id}`)).then((d) => d[key.replace(/s$/, '')]),
  // -> { record, message }
  save: (row) => data(row.id ? api.post(`/update/${path}/${row.id}`, row) : api.post(`/create/${path}`, row))
    .then((d) => ({ record: d[key.replace(/s$/, '')], message: d.message })),
  remove: (id) => api.post(`/${path}/${id}/archive`),
})

export const suppliersApi = crud('suppliers', 'suppliers')
export const customersApi = crud('customers', 'customers')
export const billsApi = crud('bills', 'bills')           // list({ doc_type: 'bill' | 'purchase_order' })
export const invoicesApi = crud('invoices', 'invoices')  // list({ doc_type: 'invoice' | 'quote' | 'order' })

// ATCs offered for each withholding form: 1601-EQ from /dropdown/atcs, MAP and SAWT from /forms.
const atcCache = {}
export const atcsFor = (form) => (atcCache[form] ??= (form === '1601EQ'
  ? data(api.get('/dropdown/atcs', { params: { form_type: '1601EQ' } })).then((d) => d.data)
  : formsApi.list().then((all) => all.find((f) => f.code === form)?.atcs ?? [])
).catch((e) => { delete atcCache[form]; throw e }))

// Where a document's withholding landed -> the Alphalist screen that shows it.
export const alphalistLink = (line) => {
  if (!line) return null
  const agent = line.withholding_agent_id ? `&agent=${line.withholding_agent_id}` : ''
  if (line.form_type === '1601EQ') return `/alphalist/qap?form=1601EQ&year=${line.year}&quarter=${line.quarter}${agent}`
  const page = line.form_type.startsWith('1600') ? 'map' : 'sawt'
  return `/alphalist/${page}?form=${line.form_type}&year=${line.year}&month=${line.month}${agent}`
}

export const alphalistLabel = (line) => {
  if (!line) return ''
  if (line.form_type === '1601EQ') return `QAP 1601-EQ Q${line.quarter} ${line.year}`
  const period = `${String(line.month).padStart(2, '0')}/${line.year}`
  return line.form_type.startsWith('1600') ? `MAP ${line.form_type.slice(0, 4)}-${line.form_type.slice(4)} ${period}` : `SAWT ${line.form_type} ${period}`
}

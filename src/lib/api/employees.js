// Adapter between FinancePro's Employees page and alphalist-api (../../alphalist-api).
// An employee belongs to a withholding agent (the employer); their compensation for a year is their line on that
// agent's 1604-C. The API answers a compensation with `alphalist_line` ({ form_type: '1604C', year, schedule, entry_id,
// withholding_agent_id }) and the line itself in `form_entry` (values computed as Alphalist's 1604-C screens do).
import api from './client'

const data = (p) => p.then((r) => r.data)
// List endpoints answer 404 when there is nothing yet.
const listOr = (p, key) => p.then((r) => r.data[key]).catch((e) => { if (e.response?.status === 404) return []; throw e })

export const employeesApi = {
  // -> employees, each with its active `compensations` (year, schedule, amounts, form_entry, alphalist_line)
  list: (params = {}) => listOr(api.get('/employees', { params: { per_page: 500, ...params } }), 'employees'),
  // One page, searched on the server: { rows, pagination: { current_page, last_page, per_page, total } }
  page: (params = {}) => {
    const per = params.per_page ?? 20
    return api.get('/employees', { params: { ...params, per_page: per, search: params.search || undefined } })
      .then((r) => ({ rows: r.data.employees, pagination: r.data.pagination }))
      .catch((e) => { if (e.response?.status === 404) return { rows: [], pagination: { current_page: 1, last_page: 1, per_page: per, total: 0 } }; throw e })
  },
  get: (id) => data(api.get(`/employees/${id}`)).then((d) => d.employee),
  // The company's 1604-C for a year, all employees: { counts: { D1, D2 }, totals: { D1: { tax_due, ... }, D2: {...} } }
  totals1604C: (agent, year) => data(api.get('/form-entries', { params: { withholding_agent_id: agent, form_type: '1604C', year, totals_only: 1 } })),
  // -> { record, message }
  save: (row) => data(row.id ? api.post(`/update/employees/${row.id}`, row) : api.post('/create/employees', row))
    .then((d) => ({ record: d.employee, message: d.message })),
  remove: (id) => data(api.post(`/employees/${id}/archive`)),
}

export const compensationsApi = {
  // body = { employee_id, year, is_mwe, subs_filing, amounts: { alphadtl field: amount } } -> { record, message }
  save: (row) => data(row.id ? api.post(`/update/employee-compensations/${row.id}`, row) : api.post('/create/employee-compensations', row))
    .then((d) => ({ record: d.employee_compensation, message: d.message })),
  remove: (id) => data(api.post(`/employee-compensations/${id}/archive`)),
}

// A compensation's 1604-C line -> the 1604-C screen for that agent and year.
export const form1604cLink = (line) => (line ? `/alphalist/1604c?agent=${line.withholding_agent_id}&year=${line.year}` : null)

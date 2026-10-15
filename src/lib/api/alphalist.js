import api, { API_BASE } from './client'

const data = (p) => p.then((r) => r.data)
const qs = (o) => '?' + new URLSearchParams(o).toString()

export const agentsApi = {
  list: () => data(api.get('/agents')),
  rdos: () => data(api.get('/rdos')),
  save: (a) => data(a.id ? api.put(`/agents/${a.id}`, a) : api.post('/agents', a)),
  remove: (id) => api.delete(`/agents/${id}`),
}

export const payeesApi = {
  list: (q, page = 1) => data(api.get('/payees', { params: { q, page } })),
  save: (p) => data(p.id ? api.put(`/payees/${p.id}`, p) : api.post('/payees', p)),
  remove: (id) => api.delete(`/payees/${id}`),
  lookup: (params) => data(api.get('/payees/lookup', { params })),
}

// period = { form: '1601EQ' | '1601FQ', year, quarter }
export const qapApi = {
  get: (agent, period) => data(api.get(`/agents/${agent}/qap`, { params: period })),
  add: (agent, period, body) => data(api.post(`/agents/${agent}/qap`, body, { params: period })),
  update: (agent, period, id, body) => data(api.put(`/agents/${agent}/qap/${id}`, body, { params: period })),
  remove: (agent, id) => api.delete(`/agents/${agent}/qap/${id}`),
  preview: (agent, period) => data(api.get(`/agents/${agent}/qap-dat`, { params: period })),
  downloadUrl: (agent, period) => `${API_BASE}/agents/${agent}/qap-dat/download${qs(period)}`,
}

export const alphalistApi = {
  overview: () => data(api.get('/alphalist')),
  send: (agent, body) => data(api.post(`/agents/${agent}/alphalist/send`, body)),
  restore: (backup) => data(api.post('/alphalist/restore', { backup })),
}

qapApi.import = (agent, period, file) => {
  const body = new FormData()
  body.append('csv', file)
  return data(api.post(`/agents/${agent}/qap-import`, body, { params: period }))
}
qapApi.templateUrl = `${API_BASE}/qap-template.csv`

export const annualApi = {
  get: (agent, opts) => data(api.get(`/agents/${agent}/1604f`, { params: opts })),
  downloadUrl: (agent, opts) => `${API_BASE}/agents/${agent}/1604f/download${qs(opts)}`,
}

const upload = (url, files) => {
  const body = new FormData()
  Object.entries(files).forEach(([k, f]) => body.append(k, f))
  return data(api.post(url, body))
}
let specCache
export const toolsApi = {
  analyze: (dat) => upload('/tools/analyze', { dat }),
  compare: (expected, actual) => upload('/tools/compare', { expected, actual }),
  spec: () => (specCache ??= data(api.get('/tools/spec'))),
}

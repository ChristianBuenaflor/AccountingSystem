// Demo session store: localStorage-backed, node-safe. No backend.
const KEY = 'fp.auth.v1'
const mem = new Map()
const store = () =>
  typeof localStorage !== 'undefined'
    ? localStorage
    : {
        getItem: (k) => (mem.has(k) ? mem.get(k) : null),
        setItem: (k, v) => mem.set(k, String(v)),
        removeItem: (k) => mem.delete(k),
      }

export function getSession() {
  try {
    const raw = store().getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.email !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function login(email) {
  const session = { email, name: email.split('@')[0] || email, at: new Date().toISOString() }
  try {
    store().setItem(KEY, JSON.stringify(session))
  } catch {
    /* quota or unavailable — session lives in memory only */
  }
  return session
}

export function logout() {
  try {
    store().removeItem(KEY)
  } catch {
    /* ignore */
  }
}

// Session store for the alphalist-api login (Sanctum bearer token). localStorage-backed, node-safe.
const KEY = 'fp.auth.v2'
const mem = new Map()
const store = () =>
  typeof localStorage !== 'undefined'
    ? localStorage
    : {
        getItem: (k) => (mem.has(k) ? mem.get(k) : null),
        setItem: (k, v) => mem.set(k, String(v)),
        removeItem: (k) => mem.delete(k),
      }

/** { token, name, email, username, at } or null */
export function getSession() {
  try {
    const raw = store().getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token) return null
    return parsed
  } catch {
    return null
  }
}

/** Save the { token, user } returned by POST /api/login. */
export function saveSession({ token, user }) {
  const session = {
    token,
    name: user?.name || user?.username || '',
    email: user?.email || '',
    username: user?.username || '',
    at: new Date().toISOString(),
  }
  try {
    store().setItem(KEY, JSON.stringify(session))
  } catch {
    /* quota or unavailable */
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

// Auth session store check (alphalist-api login: Sanctum bearer token).
// Run: node scripts/verify-auth.mjs
const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
}

const auth = await import('../src/lib/store/auth.js')

let n = 0
const ok = (cond, msg) => { n++; if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1) } console.log(`ok ${n} - ${msg}`) }

ok(auth.getSession() === null, 'empty store → null')
const s = auth.saveSession({ token: '1|abc', user: { name: 'Juan', username: 'juan', email: 'juan@test.ph' } })
ok(s.token === '1|abc' && s.name === 'Juan' && s.email === 'juan@test.ph' && typeof s.at === 'string', 'saveSession returns {token,name,email,at}')
ok(JSON.parse(mem.get('fp.auth.v2')).token === '1|abc', 'persists under fp.auth.v2')
ok(auth.getSession()?.username === 'juan', 'getSession reads back session')
auth.logout()
ok(auth.getSession() === null && globalThis.localStorage.getItem('fp.auth.v2') === null, 'logout clears session')
for (const bad of ['{bad json', '42', 'null', '{"name":"x"}', '{"token":""}', '[1,2]']) {
  mem.set('fp.auth.v2', bad)
  ok(auth.getSession() === null, `corrupt ${bad} → null`)
}
mem.set('fp.auth.v1', JSON.stringify({ email: 'old@demo.ph' }))
mem.delete('fp.auth.v2')
ok(auth.getSession() === null, 'old demo sessions (no token) no longer count as logged in')

console.log(`\nPASS ${n} checks`)

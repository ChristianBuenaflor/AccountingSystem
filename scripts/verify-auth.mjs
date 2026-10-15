// Task 1 check: auth session store.
// Run: node scripts/verify-auth.mjs — FAILS before src/lib/store/auth.js exists.
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
const s = auth.login('juan@test.ph')
ok(s.email === 'juan@test.ph' && s.name === 'juan' && typeof s.at === 'string', 'login returns {email,name,at}')
ok(mem.get('fp.auth.v1') !== null && JSON.parse(mem.get('fp.auth.v1')).email === 'juan@test.ph', 'persists under fp.auth.v1')
ok(auth.getSession()?.email === 'juan@test.ph', 'getSession reads back session')
auth.logout()
ok(auth.getSession() === null && globalThis.localStorage.getItem('fp.auth.v1') === null, 'logout clears session')
for (const bad of ['{bad json', '42', 'null', '{"name":"x"}', '[1,2]']) {
  mem.set('fp.auth.v1', bad)
  ok(auth.getSession() === null, `corrupt ${bad} → null`)
}

console.log(`\nPASS ${n} checks`)

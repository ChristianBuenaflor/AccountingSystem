// RED test for Task 1: mock store + collection hook.
// Run: node scripts/verify-mock.mjs — must FAIL before src/lib/store exists,
// PASS after.
const mem = new Map()
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
}

const db = await import('../src/lib/store/db.js')
const fs = await import('node:fs')

let n = 0
const ok = (cond, msg) => { n++; if (!cond) { console.error(`FAIL: ${msg}`); process.exit(1) } console.log(`ok ${n} - ${msg}`) }

// 1. load falls back to seed when empty
const seed = () => [{ id: 1, name: 'a' }]
ok(JSON.stringify(db.load('t_basic', seed)) === JSON.stringify(seed()), 'load returns seed when empty')

// 2. save persists under fp.<key>.v1
db.save('t_basic', [{ id: 9 }])
ok(mem.get('fp.t_basic.v1') === JSON.stringify([{ id: 9 }]), 'save writes fp.<key>.v1')

// 3. load reads back saved rows
ok(JSON.stringify(db.load('t_basic', seed)) === JSON.stringify([{ id: 9 }]), 'load reads saved rows')

// 4. corrupt JSON falls back to seed, no throw
mem.set('fp.t_corrupt.v1', '{bad json')
ok(JSON.stringify(db.load('t_corrupt', seed)) === JSON.stringify(seed()), 'corrupt JSON falls back to seed')

// 5. seeds object covers all entities (source-faithful shared tables:
// sales holds INV/QT/SO rows; purchases holds PO/BL rows)
for (const k of ['sales','purchases','contacts','journals','reconciliations','assets','mailbox','events','products','employees','settings']) {
  ok(typeof db.seeds?.[k] === 'function' && db.seeds[k]().length >= 2, `seeds.${k} has >=2 rows`)
}

// 6. useCollection hook exists, exports, no axios
const src = fs.readFileSync(new URL('../src/lib/store/useCollection.js', import.meta.url), 'utf8')
ok(src.includes('useCollection'), 'useCollection exported')
ok(!src.includes('axios'), 'hook has no axios')

// 7. wrong-shape valid JSON falls back to seed (array seeds)
mem.set('fp.t_shape.v1', '{"a":1}')
ok(JSON.stringify(db.load('t_shape', seed)) === JSON.stringify(seed()), 'wrong-shape JSON falls back to seed')

console.log(`\nPASS ${n} checks`)

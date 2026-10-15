# FinancePro Pages Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every placeholder ListPage with the source-equivalent full-function page backed by localStorage mock data.

**Architecture:** Add a tiny mock store (`src/mock/db.js` + `useCollection` hook); copy 26 source pages into `src/pages/full/` swapping only axios calls for the hook; rewire `App.jsx`/`nav.js`; append missing CSS; add 3 deps.

**Tech Stack:** React 18.3.1, react-router-dom 6.26.2, react-bootstrap 2.10.4, axios 1.7.7 (kept for alphalist), new: lucide-react, framer-motion, recharts@2.15.

**Spec:** `docs/superpowers/specs/2026-10-16-financepro-pages-merge-design.md`

## Global Constraints

- No Laravel backend changes; no network calls remain in ported pages.
- localStorage keys are exactly `fp.<key>.v1` (e.g. `fp.invoices.v1`).
- recharts MUST be `2.15.x` (React 18 compat; source uses 3.x on React 19).
- Ported pages live in `src/pages/full/`; Alphalist pages in `src/pages/` untouched.
- Route swaps (agreed): trial-balance → cash-flow, products/categories → products/services, plus new Dashboard at `/`.
- `npm run build` must pass after every task.

## Review Focus

- Corrupt localStorage JSON (`fp.invoices.v1 = "{bad"`) → page falls back to seed, no crash (Task 1 test).
- Empty collections on Dashboard → charts render static fallback series, stat cards show `—` (Task 3 test).
- Dangling `contact_id` (invoice points at deleted contact) → row shows `—`, no crash (Task 3 test).
- Invalid date strings in mock seeds → `toLocaleDateString` guarded, shows raw or `—` (Task 4 test).
- Stale bookmark to retired `/reports/trial-balance` → redirects to `/reports/cash-flow`, no blank 404 (Task 7 test).

---

### Task 1: Mock store + collection hook

**Files:**
- Create: `src/mock/db.js`
- Create: `src/mock/useCollection.js`
- Test: `scripts/verify-mock.mjs` (node assertion script, deleted after pass or kept)

**Interfaces:**
- Consumes: none.
- Produces:
  - `load(key: string, seed: () => any[]) -> any[]`
  - `save(key: string, rows: any[]) -> void`
  - `useCollection(key: string, seedFn: () => any[]) -> { rows: any[], create(row: object) -> object, update(id: string|number, patch: object) -> void, remove(id: string|number) -> void, reload() -> void }`
  - IDs: `create` assigns `id: Date.now()` when missing.

- [ ] **Step 1: Write the failing check** in `scripts/verify-mock.mjs` asserting: corrupt JSON falls back to seed; `create` persists under `fp.<key>.v1`; `update`/`remove` round-trip (stub a `localStorage` shim for node).
- [ ] **Step 2: Run it to verify it fails** — Run: `node scripts/verify-mock.mjs` — Expected: FAIL (`Cannot find module ../src/mock/db.js` or hook missing).
- [ ] **Step 3: Implement `load/save` in `src/mock/db.js`** — try/catch JSON parse, `fp.${key}.v1` prefix, quota errors swallowed to in-memory.
- [ ] **Step 4: Implement `useCollection` in `src/mock/useCollection.js`** — `useState` + `useEffect` initial `load`, mutators call `save` synchronously.
- [ ] **Step 5: Run check to verify it passes** — Run: `node scripts/verify-mock.mjs` — Expected: PASS (all asserts).
- [ ] **Step 6: Seed factories** — add exported `seeds` object in `db.js` with 2–3 rows per key matching source field names (invoices: id/invoice_number/contact_id/date/due_date/total_amount/status/notes; contacts: id/name/email/phone/type; mirror pattern for quotes, orders, bills, suppliers, journals, reconciliations, assets, mailbox, events, tasks, products, services, employees, settings).
- [ ] **Step 7: Commit** — `git add src/mock scripts/verify-mock.mjs && git commit -m "feat: add localStorage mock store"`

### Task 2: Deps + shared CSS

**Files:**
- Modify: `package.json`
- Modify: `src/index.css` (append only)

**Interfaces:**
- Consumes: none.
- Produces: `btn-accent`, `stat-card`, `stat-icon/value/label`, `sidebar-link/submenu` (only if missing), `.card` shadow tokens available to full pages.

- [ ] **Step 1: Write the failing check** — Run: `npm ls lucide-react framer-motion recharts` — Expected: FAIL (not installed).
- [ ] **Step 2: Install** — Run: `npm i lucide-react framer-motion recharts@2.15` — Expected: packages added, `recharts@2.15.x` in `package.json`.
- [ ] **Step 3: Append CSS** — copy from source `src/index.css` the blocks `.btn-accent`, `.stat-card/.stat-icon/.stat-value/.stat-label`, `.card`, `.table thead th` overrides only if the selector is absent in target `src/index.css`. No existing lines modified.
- [ ] **Step 4: Verify** — Run: `npm run build` — Expected: PASS (no new errors; Dashboard charts compile).
- [ ] **Step 5: Commit** — `git add package.json package-lock.json src/index.css && git commit -m "chore: add full-pages deps and css tokens"`

### Task 3: Core sales batch (Dashboard, Sales, Quotes, Orders)

**Files:**
- Create: `src/pages/full/Dashboard.jsx`, `src/pages/full/Sales.jsx`, `src/pages/full/Quotes.jsx`, `src/pages/full/Orders.jsx`

**Interfaces:**
- Consumes: `useCollection` from Task 1.
- Produces: four default-export components with zero `axios` imports and identical UI to source.

- [ ] **Step 1: Write the failing check** — `grep -r "from 'axios'" src/pages/full/ | wc -l` must equal 0 after task; before: files missing. Also assert Dashboard renders with empty store (stat cards show `—`, charts render).
- [ ] **Step 2: Copy + transform each file** — copy from source `src/pages/<Name>.jsx`; delete `axios` import; replace `axios.get('/api/sales')` pattern with `const { rows: invoices, create, update, remove } = useCollection('invoices', seeds.invoices)` (analogous keys: `quotes`, `orders`); `post/put/delete` → hook mutators; second `useCollection('contacts', ...)` filtered `type === 'customer'` for joins; dangling `contact_id` renders `—`; Dashboard uses `useCollection` for sales/contacts/products/events plus static `chartData` fallback when empty.
- [ ] **Step 3: Verify** — Run: `grep -r axios src/pages/full/ ; npm run build` — Expected: no axios hits in `full/`, build PASS.
- [ ] **Step 4: Commit** — `git add src/pages/full/Dashboard.jsx src/pages/full/Sales.jsx src/pages/full/Quotes.jsx src/pages/full/Orders.jsx && git commit -m "feat: port dashboard and sales pages to mock store"`

### Task 4: Purchases + journals batch

**Files:**
- Create: `src/pages/full/Purchases.jsx`, `src/pages/full/Bills.jsx`, `src/pages/full/Suppliers.jsx`, `src/pages/full/Journals.jsx`

**Interfaces:**
- Consumes: `useCollection` from Task 1.
- Produces: four default-export components, no axios, guarded dates/numbers.

- [ ] **Step 1: Write the failing check** — assert Journals create/edit/delete round-trips via hook and invalid date strings render without throwing.
- [ ] **Step 2: Copy + transform** — same pattern as Task 3 with keys `orders(pos)`, `bills`, `suppliers`, `journals`; keep status badges, confirm() deletes, modal forms identical.
- [ ] **Step 3: Verify** — Run: `npm run build` — Expected: PASS.
- [ ] **Step 4: Commit** — `git add src/pages/full/Purchases.jsx src/pages/full/Bills.jsx src/pages/full/Suppliers.jsx src/pages/full/Journals.jsx && git commit -m "feat: port purchases and journals pages"`

### Task 5: Accounting batch (reconciliations, assets, reports)

**Files:**
- Create: `src/pages/full/Reconciliations.jsx`, `src/pages/full/BankReconciliation.jsx`, `src/pages/full/CreditCardReconciliation.jsx`, `src/pages/full/FixedAssets.jsx`, `src/pages/full/Reports.jsx`, `src/pages/full/ProfitLoss.jsx`, `src/pages/full/BalanceSheet.jsx`, `src/pages/full/CashFlow.jsx`

**Interfaces:**
- Consumes: `useCollection` from Task 1.
- Produces: eight components, no axios; Reports/P&L/Balance/CashFlow derive from journals/sales/purchases collections.

- [ ] **Step 1: Write the failing check** — assert reports render with empty store (show `No data.` states, no NaN totals).
- [ ] **Step 2: Copy + transform** — keys `reconciliations`, `assets`, plus report pages reading `journals`/`invoices`/`bills` collections; keep table structures verbatim.
- [ ] **Step 3: Verify** — Run: `npm run build` — Expected: PASS.
- [ ] **Step 4: Commit** — `git add src/pages/full/Reconciliations.jsx src/pages/full/BankReconciliation.jsx src/pages/full/CreditCardReconciliation.jsx src/pages/full/FixedAssets.jsx src/pages/full/Reports.jsx src/pages/full/ProfitLoss.jsx src/pages/full/BalanceSheet.jsx src/pages/full/CashFlow.jsx && git commit -m "feat: port reconciliations assets reports pages"`

### Task 6: Operations batch (mailbox → account)

**Files:**
- Create: `src/pages/full/Mailbox.jsx`, `src/pages/full/Scheduler.jsx`, `src/pages/full/Calendar.jsx`, `src/pages/full/Tasks.jsx`, `src/pages/full/Products.jsx`, `src/pages/full/Services.jsx`, `src/pages/full/Contacts.jsx`, `src/pages/full/Employees.jsx`, `src/pages/full/Setup.jsx`, `src/pages/full/AccountSettings.jsx`

**Interfaces:**
- Consumes: `useCollection` from Task 1.
- Produces: ten components, no axios; Setup (427 lines) keeps all sections with mock persistence.

- [ ] **Step 1: Write the failing check** — assert Contacts CRUD round-trips and Setup renders all sections from mock settings.
- [ ] **Step 2: Copy + transform** — keys `mailbox`, `events`, `tasks`, `products`, `services`, `contacts`, `employees`, `settings`; Calendar/Tasks share `events`/`tasks` keys with Dashboard upcoming-events.
- [ ] **Step 3: Verify** — Run: `npm run build` — Expected: PASS.
- [ ] **Step 4: Commit** — `git add src/pages/full/ && git commit -m "feat: port operations and settings pages"`

### Task 7: Routes + nav + final verify

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/nav.js`
- Modify: `src/pages/full/` (none, reference only)

**Interfaces:**
- Consumes: all `src/pages/full/*` components from Tasks 3–6.
- Produces: every BUSINESS/ACCOUNTING/OTHER/SETTINGS path renders a full page; Alphalist routes unchanged.

- [ ] **Step 1: Write the failing check** — `npm run build` currently routes ported paths to generic `ListPage`; assert after: `grep -c "ListPage" src/App.jsx` equals 0 for ported paths and `/reports/trial-balance` absent.
- [ ] **Step 2: Rewire `src/nav.js`** — add Dashboard entry (`/`, title Dashboard); replace `trial-balance` child with `cash-flow` (label Cash Flow, path `/reports/cash-flow`); replace `products/categories` child with `services` (label Services, path `/products/services`); add `dattools`-style plain entries only if needed for `/reconciliations`, `/reports`, `/scheduler` overview routes (else leave groups as toggles).
- [ ] **Step 3: Rewire `src/App.jsx`** — import all 26 full components; `/` → Dashboard (remove Navigate redirect); map each path per spec §5 (Sales→`/sales/invoices` … AccountSettings→`/account`); overview routes `/reconciliations`, `/reports`, `/scheduler`; legacy `/reports/trial-balance` → `<Navigate to="/reports/cash-flow" replace />`; keep all `/alphalist/*` routes verbatim.
- [ ] **Step 4: Verify build + smoke** — Run: `npm run build` — Expected: PASS. Then `npm run dev` smoke: `/`, `/sales/invoices`, `/purchases/bills`, `/journals`, `/reports/profit-loss`, `/reports/cash-flow`, `/scheduler/calendar`, `/products/services`, `/contacts`, `/alphalist/agents` all render; one create/edit/delete per entity type persists after reload.
- [ ] **Step 5: Commit** — `git add src/App.jsx src/nav.js && git commit -m "feat: wire full pages into routes"`

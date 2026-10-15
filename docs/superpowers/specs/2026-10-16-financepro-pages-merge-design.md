# FinancePro Pages Merge — Design Spec
Date: 2026-10-16
Status: awaiting review

## 1. Outcome
Port all full-function pages from `AccountingSystem` (source) into
`financepro-fullstack/react-frontend` (target) so every nav entry shows
real CRUD/Charts/Calendar instead of the generic empty `ListPage`.

Success:
- All BUSINESS/ACCOUNTING/OTHER/SETTINGS nav paths render source-equivalent UI with working create/edit/delete.
- Alphalist pages (`/alphalist/*`) untouched and still working.
- Works offline with `localStorage` persistence; `npm run build` passes.

Non-goals:
- No Laravel backend changes.
- No Supabase/Vercel dependency.
- LandingPage (`/`) from source is NOT ported.

## 2. Constraints (agreed)
- Data: local mock + `localStorage` (user chose).
- Shell: keep target `Sidebar/Topbar/nav.js` routes; swap page bodies only (user chose).
- Approach: #1 Direct port + mock adapter.

## 3. Inventory
Source: 27 pages, ~3205 lines. Porting 26 (exclude `LandingPage.jsx` 258 lines).
Large files: `Setup.jsx` 427, `AccountSettings.jsx` 323, `Dashboard.jsx` 167,
`Reports.jsx` 154. Remainder ~40–115 lines each (typical CRUD table + modal).

## 4. Architecture
- New `src/mock/db.js`: `load(key, seed)`, `save(key, rows)`, seed factories
  per entity (invoices, quotes, orders, bills, suppliers, journals,
  reconciliations, assets, reports-data, mailbox, events, tasks, products,
  services, contacts, employees, settings).
- New `src/mock/useCollection.js`: `useCollection(key, seed)` →
  `{ rows, create, update, remove, reload }` backed by `localStorage`
  (`fp.<key>.v1`). JSON-parse guarded with seed fallback.
- New `src/pages/full/*`: 1:1 copies of source pages with only the data
  layer swapped:
  `axios.get('/api/X')` → `useCollection`, `post/put/delete` → hook mutators.
  UI (Bootstrap Table/Modal/Badge, lucide icons, recharts, framer-motion)
  kept as-is. `contact_id` joins resolved against mock contacts.
- `src/App.jsx`: route each `nav.js` path to its full page; remove generic
  `ListPage` mapping for ported paths; add `/` → Dashboard, plus new
  `/reports/cash-flow`, `/products/services`, overview routes. `src/nav.js` is
  extended additively except two swaps: trial-balance → cash-flow,
  products/categories → products/services; plus a new Dashboard entry.
- `src/index.css`: append missing source tokens (`btn-accent`, `stat-card`,
  `sidebar-link/submenu`, topbar, landing excluded).
- Deps: add `lucide-react`, `framer-motion`, `recharts@2.15` (pinned 2.x for
  React 18 compat; source uses 3.x on React 19).

## 5. Route map (source → target)
- Dashboard → `/` (replaces `<Navigate to="/sales/invoices">`)
- Sales → `/sales/invoices`, Quotes → `/sales/quotes`, Orders → `/sales/orders`
- Purchases (PO list) → `/purchases/orders`, Bills → `/purchases/bills`,
  Suppliers → `/purchases/suppliers`
- Journals → `/journals`
- Reconciliations overview → `/reconciliations` (new index route),
  Bank → `/reconciliations/bank`, CreditCard → `/reconciliations/credit-card`
- FixedAssets → `/fixed-assets`
- Reports overview → `/reports` (new), ProfitLoss → `/reports/profit-loss`,
  BalanceSheet → `/reports/balance-sheet`,
  CashFlow → `/reports/cash-flow` (new; trial-balance placeholder retired)
- Mailbox → `/mailbox`
- Scheduler overview → `/scheduler` (new), Calendar → `/scheduler/calendar`,
  Tasks → `/scheduler/tasks`
- Products → `/products/items`, Services → `/products/services` (new;
  replaces categories placeholder)
- Contacts → `/contacts`, Employees → `/employees`
- Setup → `/setup`, AccountSettings → `/account`

## 6. Data flow
- Each page calls `useCollection(key, seedFn)` on mount (replaces `useEffect`
  axios fetch). Mutations update React state + `localStorage` synchronously.
- Cross-entity reads (e.g. Sales needs customers) use a second
  `useCollection('contacts')` filtered by `type === 'customer'`.
- Dashboard/Reports derive stats from collections + keep source static chart
  series as fallback when collections are empty.
- No network calls remain in ported pages.

## 7. Error handling & edges
- Keep source empty-states (`No invoices found.` etc.).
- Keep `confirm()` deletes; guarded `new Date(...)` + `parseFloat` as in source.
- `localStorage` quota/parse errors → fall back to in-memory seed, no crash.
- `nav.js` existing titles/subs unchanged except the two agreed swaps
  (trial-balance → cash-flow, categories → services) plus new Dashboard entry;
  BalanceSheet label typo (`Calculator Sheet`)
  kept to avoid extra churn (fix later).

## 8. Testing
- `npm install` + `npm run build` must pass.
- `npm run dev` smoke: `/`, `/sales/invoices`, `/purchases/bills`,
  `/journals`, `/reports/profit-loss`, `/scheduler/calendar`, `/contacts`,
  `/alphalist/agents` (regression).
- Per entity type: create → appears; edit → persists after reload; delete →
  gone after reload.

## 9. Execution (after spec approval)
Invoke `writing-plans` skill for phased implementation plan
(mock layer → deps+CSS → batch ports → routes → build/verify).
No product code until plan is reviewed.

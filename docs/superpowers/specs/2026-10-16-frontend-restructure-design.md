# Frontend src/ Restructure — Design Spec
Date: 2026-10-16
Status: awaiting review

## 1. Outcome
Reorganize `react-frontend/src/` into a professional domain-grouped layout
with zero behavior change. Every route renders exactly as today; only file
locations, import paths, and dead files change.

Success:
- `src/pages/` holds 11 domain folders; no folder holds more than 6 pages.
- Shared code lives in `src/lib/store/` and `src/lib/api/`; config in
  `src/config/nav.js`.
- Dead files (`ListPage.jsx`, `DatToolsPage.jsx`, root `err.txt`) deleted.
- `npm run build` passes; preview smoke of key routes passes.

Non-goals:
- No UI, copy, route, or data-behavior changes.
- `src/components/`, `src/main.jsx`, `src/index.css` untouched except import
  path updates where required (Sidebar's nav import).
- Nothing outside `react-frontend/src/` (and `scripts/verify-mock.mjs`
  path references) is touched.

## 2. Constraints (agreed)
- Scope: frontend `src/` only (user chose).
- Style: domain groups + `lib/` (user chose approach #1).
- No git repo exists: moves are plain filesystem moves, no commits.

## 3. Current state (verified)
- 26 full pages in `src/pages/full/` all import via `../../mock/`.
- 6 live alphalist pages in `src/pages/` import via `../api/`.
- `src/nav.js` imported only by `src/components/Sidebar.jsx`.
- Dead: `src/pages/ListPage.jsx` (zero importers), `src/pages/DatToolsPage.jsx`
  (App uses `DatToolPages.jsx`), root `err.txt` (empty stray).

## 4. Target layout
- `src/pages/overview/` — Dashboard
- `src/pages/sales/` — Sales, Quotes, Orders
- `src/pages/purchases/` — Purchases, Bills, Suppliers
- `src/pages/accounting/` — Journals, Reconciliations, BankReconciliation,
  CreditCardReconciliation, FixedAssets
- `src/pages/reports/` — Reports, ProfitLoss, BalanceSheet, CashFlow
- `src/pages/schedule/` — Scheduler, Calendar, Tasks
- `src/pages/mailbox/` — Mailbox
- `src/pages/catalog/` — Products, Services
- `src/pages/people/` — Contacts, Employees
- `src/pages/settings/` — Setup, AccountSettings
- `src/pages/alphalist/` — AgentsPage, PayeesPage, QapPage, AlphalistPage,
  Annual1604FPage, DatToolPages
- `src/components/` — unchanged (Sidebar, Topbar, AgentPicker, AnalysisView,
  FormModal, PageHeader, SendPanel)
- `src/lib/store/` — db.js, useCollection.js, dates.js, reports.js
  (moved from `src/mock/`, no body changes)
- `src/lib/api/` — client.js, alphalist.js (moved from `src/api/`, no body
  changes)
- `src/config/nav.js` — moved from `src/nav.js`, content changes limited to
  the agreed swaps already present (cash-flow, services, Dashboard entry)
- `src/App.jsx`, `src/main.jsx`, `src/index.css` stay in place; App.jsx
  import block regrouped by domain.

## 5. Import rewrite map (mechanical, scripted)
- In moved full pages: `../../mock/` → `../../lib/store/`.
- In moved alphalist pages/components: `../api/` → depth-correct
  `../../lib/api/` (pages now one level deeper; components unchanged in
  depth, so `../api/` → `../lib/api/`).
- `src/components/Sidebar.jsx`: `../nav` → `../config/nav`.
- `App.jsx`: page imports rewritten to new domain paths, grouped by domain
  with comments; route elements unchanged.
- `scripts/verify-mock.mjs`: relative import `../src/mock/db.js` →
  `../src/lib/store/db.js`; fs read of `useCollection.js` path updated.

## 6. Deletions
- `src/pages/ListPage.jsx`, `src/pages/DatToolsPage.jsx`, `err.txt`
  (root of react-frontend).

## 7. Verification (gates, in order)
1. `grep -rn "mock/\|from '../api\|from './nav'\|ListPage\|DatToolsPage" src/`
   returns zero (proves no stale paths).
2. `esbuild` parses every file under `src/` and `scripts/`.
3. `node scripts/verify-mock.mjs` passes 18/18.
4. `npm run build` passes.
5. Preview smoke: `/`, `/sales/invoices`, `/journals`,
   `/reports/cash-flow`, `/alphalist/agents` return 200.

## 8. Execution (after spec approval)
Invoke `writing-plans` skill for the implementation plan
(move script → import rewrite → deletions → verification gates).
No filesystem changes until plan is reviewed.

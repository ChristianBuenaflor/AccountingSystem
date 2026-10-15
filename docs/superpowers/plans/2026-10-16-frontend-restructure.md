# Frontend src/ Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `react-frontend/src/` to the domain-grouped layout with zero behavior change.

**Architecture:** Scripted plain-filesystem moves (no git repo exists) followed by scripted import rewrites per the spec's depth map, then deletions, then five verification gates.

**Tech Stack:** React 18 + Vite 5 project; moves via shell (`mkdir`, `mv`/`move`); verification via `grep`, `esbuild`, `node`, `npm run build`.

**Spec:** `docs/superpowers/specs/2026-10-16-frontend-restructure-design.md`

## Global Constraints

- No UI, copy, route, or data-behavior changes; page bodies untouched.
- No git repo exists: moves are plain filesystem moves, no commits.
- `src/components/`, `src/main.jsx`, `src/index.css` untouched except `Sidebar.jsx`'s nav import.
- Nothing outside `react-frontend/src/` and `scripts/verify-mock.mjs` path references is touched.

## Review Focus

- A page moved one level deeper/further whose import rewrite uses the wrong depth (`../` vs `../../`) → blank page or build error; a reasonable person expects every page to load after a move (Task 2 grep + build gate).
- An importer of `src/api/*` outside the known alphalist files → broken alphalist page after the `lib/api` move (Task 2 pre-move grep inventory).
- `App.jsx` regroup dropping or duplicating a route → dead nav entry; route count must equal 37 before and after (Task 2 count check).
- `scripts/verify-mock.mjs` still pointing at `src/mock/` → false RED hiding real breakage (Task 4 runs it from the new path).
- Case-only drift in moved paths (Windows-tolerant, Linux-deploy-strict) → expect identical byte names; moves preserve names exactly (Task 1 listing check).

---

### Task 1: Create domain dirs and move files

**Files:**
- Create dirs: `src/pages/{overview,sales,purchases,accounting,reports,schedule,mailbox,catalog,people,settings,alphalist}/`, `src/lib/store/`, `src/lib/api/`, `src/config/`
- Move: 26 files `src/pages/full/*.jsx` → domain dirs per spec §4; 6 files `src/pages/{AgentsPage,PayeesPage,QapPage,AlphalistPage,Annual1604FPage,DatToolPages}.jsx` → `src/pages/alphalist/`; 4 files `src/mock/*.js` → `src/lib/store/`; 2 files `src/api/*.js` → `src/lib/api/`; `src/nav.js` → `src/config/nav.js`
- Test: shell listing

**Interfaces:**
- Consumes: none.
- Produces: exact new paths every later task relies on (spec §4 verbatim).

- [ ] **Step 1: Write the failing check**

```bash
test -f src/pages/sales/Sales.jsx && test -f src/lib/store/db.js && test -f src/config/nav.js && echo MOVE-OK || echo MOVE-MISSING
```
Expected: `MOVE-MISSING`.

- [ ] **Step 2: Run check to verify it fails**

Run: the command above from `react-frontend/`.
Expected: `MOVE-MISSING`.

- [ ] **Step 3: Move the files** with `mkdir -p` + `mv`, names byte-identical, per spec §4 (26 + 6 + 4 + 2 + 1 = 39 moves).

- [ ] **Step 4: Run check to verify it passes, plus full inventory**

Run: Step 1 command, then `find src/pages src/lib src/config -type f | sort`.
Expected: `MOVE-OK`; listing shows 11 domain dirs populated exactly per spec §4, and old dirs `src/pages/full/`, `src/mock/`, `src/api/` are empty.

### Task 2: Rewrite imports

**Files:**
- Modify: all 32 moved page files, `src/components/Sidebar.jsx`, `src/App.jsx`, `scripts/verify-mock.mjs`

**Interfaces:**
- Consumes: new paths from Task 1.
- Produces: zero stale import paths (Task 4's grep gate relies on this).

- [ ] **Step 1: Write the failing check**

```bash
grep -rn "mock/\|from '\.\./api\|from '\./nav'" src/ ; echo "stale-exit:$?"
```
Expected: FAIL — matches found (stale paths still present).

- [ ] **Step 2: Inventory `src/api/*` importers before rewriting**

Run: `grep -rln "api/client\|api/alphalist" src/`.
Expected: only the known alphalist files (components: AgentPicker, AnalysisView, SendPanel; pages now in `pages/alphalist/`). Any surprise file is a finding — ledger it and include it in the rewrite.

- [ ] **Step 3: Apply the spec §5 rewrite map** (`../../mock/` → `../../lib/store/` in moved full pages; `../api/` → `../../lib/api/` in moved alphalist pages; `../api/` → `../lib/api/` in `src/components/*`; `../nav` → `../config/nav` in `Sidebar.jsx`; `App.jsx` imports regrouped by domain with zero route changes; `verify-mock.mjs` paths → `../src/lib/store/`).

- [ ] **Step 4: Run check to verify it passes**

Run: Step 1 command.
Expected: no matches (`stale-exit:1`).

- [ ] **Step 5: Route-count check**

Run: `grep -c "<Route" src/App.jsx` and compare against the pre-move count of 37.
Expected: equal (37). Any delta is a finding — fix before proceeding.

### Task 3: Delete dead files

**Files:**
- Delete: `src/pages/ListPage.jsx`, `src/pages/DatToolsPage.jsx`, `err.txt` (react-frontend root)

**Interfaces:**
- Consumes: Task 2's zero-stale-refs result (proves nothing imports them).
- Produces: a tree with no dead weight for Task 4 to verify.

- [ ] **Step 1: Write the failing check**

```bash
test -f src/pages/ListPage.jsx || test -f src/pages/DatToolsPage.jsx || test -f err.txt && echo DEAD-PRESENT || echo DEAD-GONE
```
Expected: `DEAD-PRESENT`.

- [ ] **Step 2: Confirm zero importers, then delete**

Run: `grep -rln "ListPage\|DatToolsPage" src/ | grep -v "pages/ListPage.jsx"` — Expected: no output (only the file itself, if even that). Then delete the three paths.

- [ ] **Step 3: Run check to verify it passes**

Run: Step 1 command.
Expected: `DEAD-GONE`.

### Task 4: Verification gates

**Files:**
- Test: `scripts/verify-mock.mjs` (from new path), full `npm run build`, preview smoke

**Interfaces:**
- Consumes: moved tree (Task 1), rewritten imports (Task 2), deletions (Task 3).

- [ ] **Step 1: Stale-path gate**

Run: `grep -rn "mock/\|from '\.\./api\|from '\./nav'\|ListPage\|DatToolsPage" src/`.
Expected: zero matches.

- [ ] **Step 2: Parse gate**

Run: `for f in src/pages/*/*.jsx src/lib/*/*.js src/config/*.js; do npx esbuild "$f" --loader:.jsx=jsx > /dev/null || echo "FAIL: $f"; done`.
Expected: no `FAIL` lines (30 files).

- [ ] **Step 3: Mock-suite gate**

Run: `node scripts/verify-mock.mjs`.
Expected: `PASS 18 checks`.

- [ ] **Step 4: Build gate**

Run: `npm run build`.
Expected: `✓ built` with no errors (chunk-size warning acceptable).

- [ ] **Step 5: Smoke gate**

Run: `npm run preview`, curl `/`, `/sales/invoices`, `/journals`, `/reports/cash-flow`, `/alphalist/agents`.
Expected: all HTTP 200. Then stop the preview server.

# Landing + Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public landing page and gated demo login without changing any existing app page.

**Architecture:** New `lib/store/auth.js` session store, new `pages/public/` pages, new `RequireAuth` gate component; `App.jsx` split into public routes (no shell) and gated shell routes; nav/Topbar/CSS follow.

**Tech Stack:** React 18, react-router-dom 6, react-bootstrap, lucide-react, framer-motion (already installed).

**Spec:** `docs/superpowers/specs/2026-10-16-landing-login-design.md`

## Global Constraints

- No real authentication backend; session is localStorage key `fp.auth.v1` only.
- Source's dead buttons ("Watch Demo", "Talk to Sales") stay dead, exactly like source.
- No changes to any `pages/` domain page, `lib/store` collections, or Alphalist behavior.
- No git repo exists: plain filesystem writes, no commits.

## Review Focus

- Corrupt `fp.auth.v1` (`"{bad"`, `"42"`, `"null"`) → treated as logged out, app redirects to login, no crash (Task 1 node check).
- Logged-in user visiting `/login` → redirected to `/dashboard`, never a dead-end login form (Task 5 smoke).
- Wrong credentials (bad email, 1-char password) → inline error, stays on `/login`, no session written (Task 2 check).
- Deep link to any app page logged out (e.g. `/journals`) → lands on `/login`, no app content flash (Task 5 smoke).
- Logout then back-button into a gated page → gate re-checks each render and redirects to `/login` (Task 5 round-trip).

---

### Task 1: Auth session store

**Files:**
- Create: `src/lib/store/auth.js`
- Test: `scripts/verify-auth.mjs`

**Interfaces:**
- Consumes: none.
- Produces:
  - `getSession() -> {email: string, name: string, at: string} | null`
  - `login(email: string) -> {email, name, at}` (name = part before `@`, at = `new Date().toISOString()`)
  - `logout() -> void`
  - Storage key exactly `fp.auth.v1`; corrupt/missing/wrong-shape JSON → `null`.

- [ ] **Step 1: Write the failing check** in `scripts/verify-auth.mjs`: shim `localStorage` (Map-backed), assert `getSession()` is null when empty; `login('a@b.co')` returns session with name `'a'` and persists under `fp.auth.v1`; `logout()` clears to null; `"{bad"`, `"42"`, `"null"` each → null.
- [ ] **Step 2: Run check to verify it fails**

Run: `node scripts/verify-auth.mjs`
Expected: FAIL (`Cannot find module .../src/lib/store/auth.js`).

- [ ] **Step 3: Implement `getSession/login/logout` in `src/lib/store/auth.js`** per Interfaces (try/catch parse, shape-check `typeof parsed.email === 'string'`).

- [ ] **Step 4: Run check to verify it passes**

Run: `node scripts/verify-auth.mjs`
Expected: PASS all asserts.

### Task 2: Login page

**Files:**
- Create: `src/pages/public/Login.jsx`

**Interfaces:**
- Consumes: `login` from Task 1.
- Produces: default-export `Login` using `useNavigate`; no `axios` imports.

- [ ] **Step 1: Write the failing check**

Run: `test -f src/pages/public/Login.jsx && echo LOGIN-EXISTS || echo LOGIN-MISSING`
Expected: `LOGIN-MISSING`.

- [ ] **Step 2: Implement `Login`** — split layout (dark gradient brand panel reusing `#1a2332`/`#00b894` tokens + white card form); controlled email/password state; error state string; on submit: email must contain `@` and password length ≥ 4, else set error (`'Enter a valid email and a password of 4+ characters (demo mode).'`) and return; else `login(email)` and `navigate('/dashboard', { replace: true })`. Demo hint text: `'Demo mode — use any email, no real account needed.'` Submit button class `btn-accent`. No axios.

- [ ] **Step 3: Run checks to verify it passes**

Run: Step 1 command → `LOGIN-EXISTS`; `grep -c axios src/pages/public/Login.jsx` → `0`; `npx esbuild src/pages/public/Login.jsx --loader:.jsx=jsx > /dev/null` → clean.
Expected: all three pass.

### Task 3: Landing page + CSS

**Files:**
- Create: `src/pages/public/LandingPage.jsx`
- Modify: `src/index.css` (append only)

**Interfaces:**
- Consumes: none.
- Produces: default-export `LandingPage`; `index.css` gains `.landing-hero`, `.hero-title`, `.hero-subtitle`.

- [ ] **Step 1: Write the failing check**

Run: `test -f src/pages/public/LandingPage.jsx && grep -c "landing-hero" src/index.css`
Expected: FAIL (missing file, count `0`).

- [ ] **Step 2: Copy source `LandingPage.jsx` verbatim** except every `to="/app"` becomes `to="/login"` (4 occurrences: navbar Get Started ×2 counting mobile, hero Start Free Trial, CTA Get Started Free).

- [ ] **Step 3: Append landing styles** — copy `.landing-hero` (with `::before`/`::after` glows), `.hero-title`, `.hero-subtitle` from source `src/index.css` to the end of target `src/index.css`. No existing lines modified.

- [ ] **Step 4: Run checks to verify it passes**

Run: `grep -rn 'to="/app"' src/pages/public/LandingPage.jsx` → zero matches; `grep -c "landing-hero" src/index.css` → `3` (base + 2 pseudo-elements); `npx esbuild src/pages/public/LandingPage.jsx --loader:.jsx=jsx > /dev/null` → clean.
Expected: all pass.

### Task 4: Routes, gate, nav, Topbar

**Files:**
- Create: `src/components/RequireAuth.jsx`
- Modify: `src/App.jsx`, `src/config/nav.js`, `src/components/Topbar.jsx`

**Interfaces:**
- Consumes: `getSession/logout` (Task 1), `Login`/`LandingPage` (Tasks 2–3).
- Produces: 39 `<Route` occurrences (36→38 routes: `/` landing + `/login` added, Dashboard path change); Dashboard nav entry at `/dashboard`.

- [ ] **Step 1: Write the failing check**

Run: `grep -c "<Route" src/App.jsx`
Expected: `37` (pre-change count — proves the rewiring hasn't happened yet).

- [ ] **Step 2: Implement `RequireAuth`** — reads `getSession()` each render; non-null → `children`, else `<Navigate to="/login" replace />`.

- [ ] **Step 3: Rewire `App.jsx`** — import `LandingPage`, `Login`, `RequireAuth`, `Navigate`; public routes `/` and `/login` render WITHOUT fp-shell; all existing routes (Dashboard now at `/dashboard`, everything else unchanged) render inside shell wrapped by `<RequireAuth>`; keep all `/alphalist/*` routes verbatim inside the gate.

- [ ] **Step 4: Update nav + Topbar** — `nav.js` Dashboard entry path `/` → `/dashboard`; `Topbar.jsx` shows `getSession()?.email || 'Admin User'` plus a logout button calling `logout()` then navigating to `/login` (use `useNavigate`).

- [ ] **Step 5: Run checks to verify it passes**

Run: `grep -c "<Route" src/App.jsx` → `39`; `grep -n 'path="/dashboard"' src/App.jsx src/config/nav.js` → both present; `npx esbuild src/App.jsx src/components/RequireAuth.jsx src/components/Topbar.jsx --loader:.jsx=jsx > /dev/null` → clean.
Expected: all pass.

### Task 5: Verification

**Files:**
- Test: `npm run build`, preview smoke

**Interfaces:**
- Consumes: Tasks 1–4.

- [ ] **Step 1: Build gate**

Run: `npm run build`
Expected: `✓ built`, no errors.

- [ ] **Step 2: Static gates**

Run: `node scripts/verify-auth.mjs` → PASS; `grep -rn 'to="/app"' src/pages/public/` → zero; `grep -rln axios src/pages/public/ src/components/RequireAuth.jsx src/lib/store/auth.js` → zero.
Expected: all pass.

- [ ] **Step 3: Smoke gate**

Run preview; curl `/` (200, contains `Modern Accounting`), `/login` (200); curl `/dashboard` logged-out serves shell that redirects (200 + contains `/login` redirect or login string). Stop preview.
Expected: all 200. Then a manual login→logout round-trip in the browser (submit demo credentials → dashboard; logout → login) — record result in ledger.

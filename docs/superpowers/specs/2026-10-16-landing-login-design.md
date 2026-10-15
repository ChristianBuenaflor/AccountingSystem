# Landing + Login — Design Spec
Date: 2026-10-16
Status: awaiting review

## 1. Outcome
Add a public landing page (ported from the source project) and a new
source-styled login page with a demo session gate, without changing any
existing app page behavior.

Success:
- `/` shows the FinancePro landing page; `/login` shows login.
- Logged-out visits to any app page redirect to `/login`.
- Demo login (any email + password ≥ 4 chars) enters the app; logout
  returns to `/login`.
- `npm run build` passes; preview smoke passes.

Non-goals:
- No real authentication backend; session is localStorage only.
- Source's dead buttons ("Watch Demo", "Talk to Sales") stay dead,
  exactly like source.
- No changes to any `pages/` domain page, `lib/store` collections,
  or Alphalist behavior.

## 2. Constraints (agreed)
- Login is newly built (source has none); styled with source tokens.
- Routes + gate enforced (user chose): landing at `/`, Dashboard moves to
  `/dashboard`, app gated.

## 3. Files
- Create `src/pages/public/LandingPage.jsx`: verbatim port of source
  `LandingPage.jsx`; only change is retargeting every `to="/app"` link to
  `to="/login"`.
- Create `src/pages/public/Login.jsx`: split layout (dark gradient brand
  panel + white card form). Fields: email, password, submit `btn-accent`.
  Validation: email contains `@`, password ≥ 4 chars, else inline error.
  Shows demo hint ("Use any email — demo mode, no real account").
  On success calls `login(email)` and navigates to `/dashboard`.
- Create `src/lib/store/auth.js`: key `fp.auth.v1`; exports
  `getSession() -> {email,name,at} | null`, `login(email) -> session`,
  `logout() -> void`. Corrupt/missing JSON returns null.
- Create `src/components/RequireAuth.jsx`: returns children when
  `getSession()` is non-null, else `<Navigate to="/login" replace />`.
  Re-checks on every render (no stale session after logout in another tab
  beyond a navigation).
- Modify `src/App.jsx`: public `<Route path="/" element={<LandingPage/>}>`
  and `<Route path="/login" element={<Login/>}>` render WITHOUT the
  fp-shell; all existing routes move inside a gated shell block
  (`<RequireAuth>` wrapping the shell layout); `/` Dashboard route becomes
  `/dashboard`. Route count: 37 → 39 (adds `/`, `/login`; Dashboard path
  change, no route dropped).
- Modify `src/config/nav.js`: Dashboard entry path `/` → `/dashboard`.
- Modify `src/components/Topbar.jsx`: replace hardcoded "Admin User" with
  session email (fallback "Admin User") plus a logout button that calls
  `logout()` and navigates to `/login`.
- Modify `src/index.css` (append only): source `.landing-hero`
  (gradient + radial glows), `.hero-title`, `.hero-subtitle`.

## 4. Data flow
- Login submit → validate → `login(email)` writes
  `fp.auth.v1 = {email, name: email prefix, at: ISO timestamp}` →
  navigate `/dashboard`.
- `RequireAuth` reads `getSession()` each render; null → redirect.
- Topbar logout → `logout()` removes key → navigate `/login`.
- No network calls; Alphalist Laravel session untouched.

## 5. Error handling & edges
- Corrupt `fp.auth.v1` → treated as logged out, key left for overwrite.
- Direct navigation to `/dashboard` logged out → `/login` via immediate
  redirect (no app content flashes).
- Logged-in visit to `/login` → redirect to `/dashboard` (no dead-end).
- Short password / bad email → inline form error, no navigation.
- `Watch Demo` / `Talk to Sales` remain plain buttons (source behavior).

## 6. Testing
- `npm run build` passes.
- Preview smoke: `/` renders landing hero; `/login` renders form;
  `/dashboard` logged-out serves app shell redirecting to login;
  login round-trip (submit demo credentials → dashboard; logout → login).
- `grep` proves no remaining `to="/app"` in ported landing and no
  `axios` in new files.

## 7. Execution (after spec approval)
Invoke `writing-plans` skill for the implementation plan
(auth store → login → landing+CSS → App/nav/Topbar rewiring → verify).
No filesystem changes until plan is reviewed.

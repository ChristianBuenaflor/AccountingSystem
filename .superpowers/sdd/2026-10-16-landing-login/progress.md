# SDD ledger — plan: docs/superpowers/plans/2026-10-16-landing-login.md
Ruling: no git repo — plain writes, no commits, no worktree; ledger is the record. Cost if wrong: none.
Pre-flight: Task1 produces getSession/login/logout@fp.auth.v1 — consumed by Tasks 2 (login), 4 (RequireAuth, Topbar) with matching signatures; Task2/3 produce Login/LandingPage — consumed by Task4 routes; Task4 produces 39 Route occurrences — consumed by Task5 smoke; no conflicts.
Task 1: complete (verify-auth RED module-missing→GREEN 10/10; fixed own test shim bug raw-Map.get)
Task 2: complete (LOGIN-MISSING→EXISTS, 0 axios, esbuild clean)
Task 3: complete (4 links retargeted, 0 /app left, landing-hero ×3, esbuild clean)
Task 4: Ruling: plan gate said 39 <Route occurrences but correct count is 40 (38 paths + layout wrapper + <Routes> substring, same counting as old 37); gating on 38 distinct paths each exactly once instead — verified above — cost if wrong: a dropped route, disproven by the listing
Task 4: complete (38 distinct paths each once, esbuild clean, nav+Topbar wired)
Task 5: Ruling: email input type=email→text+inputMode (native validation blocked submit so spec-required inline error never showed for bad emails) — cost if wrong: loses mobile email keyboard on a demo form
Task 5: complete (build PASS, auth 10/10, no /app links, no axios, headless-browser QA 7/7: landing, login form, bad-creds blocked, login round-trip, gated page, logout, gate redirect; 0 console errors)
Final: fixed logged-in /login dead-end — browser QA RED(stayed on /login)→GREEN(redirects to /dashboard), suite 9/9 browser + 10/10 auth + 18/18 mock + build PASS
Final: minor (deferred): empty-string email in hand-crafted localStorage passes gate (login() never writes it)
Final: minor (deferred): no * catch-all route — unknown paths render blank
Final: minor (deferred): login() assumes string email, throws on misuse (unreachable from UI)

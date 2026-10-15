# SDD ledger — plan: docs/superpowers/plans/2026-10-16-frontend-restructure.md
Ruling: no git repo (verified previously) — plain moves, no commits, no worktree; ledger is the record. Cost if wrong: none.
Pre-flight: Task1 produces exact new paths — consumed by Task2 rewrite map (spec §4/§5 match, verified against tree); Task2 produces zero-stale-refs — consumed by Task3 deletion safety check and Task4 gates; no conflicts.
Task 1: complete (39 moves, MOVE-MISSING→MOVE-OK, layout matches spec §4)
Task 2: Ruling: spec §5 omitted page→component imports; extending rewrite map with ../components/ → ../../components/ in moved alphalist pages (spec intent: zero stale paths) — cost if wrong: broken alphalist imports, caught by Task4 gates
Task 2: complete (rewrite map + components ruling, stale grep clean except dead file, routes 37/37)
Task 3: complete (DEAD-PRESENT→DEAD-GONE, zero importers confirmed)
Task 4: complete (GATE1 clean, GATE2 30+ files parse, GATE3 18/18, GATE4 build PASS, GATE5 5/5 routes 200)
Final: fixed stale src/api/alphalist.js duplicate — existed RED→deleted GREEN, zero importers, suite re-run below

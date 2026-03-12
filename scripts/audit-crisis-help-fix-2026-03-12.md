# Crisis Help Category Fix — Audit Trail
**Date:** 2026-03-12
**Type:** Cross-category duplicate insertion (data only, no code changes)

## Summary
- **New records added:** 8
- **Total resources now in Crisis Help:** 9
- **Original records in other categories:** Unchanged

## All 9 Resources Now in Crisis Help Category

| # | Resource | City | State | Has Coords | Phone | Priority |
|---|----------|------|-------|------------|-------|----------|
| 1 | Veterans Crisis Line — 24/7 Suicide Prevention | statewide | SC | No | 988 | immediate |
| 2 | Veterans Crisis Line | statewide | national | No | 988 | immediate |
| 3 | Vet Center Call Center (After Hours) | statewide | national | No | 1-877-927-8387 | immediate |
| 4 | SC Mobile Crisis Line | statewide | SC | No | 1-833-364-2274 | immediate |
| 5 | SC Dept. of Mental Health — Veterans Services | statewide | SC | No | 803-898-8581 | — |
| 6 | WJB Dorn VAMC — PTSD Clinical Team | Columbia | SC | Yes | 803-776-4000 | — |
| 7 | Charleston VA PTSD Clinical Team | Charleston | SC | Yes | (843) 577-5011 | same_week |
| 8 | Wm. Jennings Bryan Dorn VA Medical Center — Mental Health | Columbia | SC | Yes | 803-776-4000 | — |
| 9 | Ralph H. Johnson VA Medical Center — Mental Health | Charleston | SC | Yes | 843-577-5011 | — |

Record #1 was already in crisis-help from previous import (Task #15).
Records #2–9 are new cross-category duplicates added in this task.

## Source/Category Traceability

| Resource | Original Category | Now Also In |
|----------|------------------|-------------|
| Veterans Crisis Line | mental-health | crisis-help |
| Vet Center Call Center (After Hours) | mental-health | crisis-help |
| SC Mobile Crisis Line | substance-recovery | crisis-help |
| WJB Dorn VAMC — PTSD Clinical Team | mental-health | crisis-help |
| Charleston VA PTSD Clinical Team | mental-health | crisis-help |
| SC Dept. of Mental Health — Veterans Services | mental-health | crisis-help |
| Wm. Jennings Bryan Dorn VA Medical Center — Mental Health | mental-health | crisis-help |
| Ralph H. Johnson VA Medical Center — Mental Health | mental-health | crisis-help |

## Veterans Crisis Line Confirmation
- Appears in crisis-help: Yes (2 entries — one SC, one national)
- Works without coordinates: Yes (no lat/lng required for browsing)

## Verification
1. **Front-end:** Crisis Help category shows 9 resources via /api/resources?category=crisis-help&state=SC
2. **Database:** All 9 records confirmed in Supabase with crisis-help category_id, status=approved
3. **No changes to:** homepage layout, onboarding, profile/account, navigation

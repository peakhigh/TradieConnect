# No Mock Code Rule (STRICT — applies to every change)

This rule is mandatory and overrides convenience. It applies across all screens, services, hooks, components, and Cloud Functions, on iOS, Android, and Web.

## The Rule

1. **Never mock code.** Do not write fake implementations, stubbed return values, or "pretend" logic in application code. Build the real functionality against the real backend (Firebase Auth, Firestore, Storage, Cloud Functions).

2. **Never mock functionality.** No `coming soon` handlers, no `Alert('not implemented')`, no hardcoded placeholder data standing in for a real feature, no fake counts/lists/balances. **Build incrementally — we do not need every feature on day one, and that is fine.** A feature that isn't built yet is simply left out of the UI; it is never faked. When you do build a feature, build it for real.

3. **Develop the functionality first, then use scripts to generate mock DATA** to exercise and test it. The only acceptable "mock" is **seed data written to the real database by a script** so we can see how the implemented functionality behaves. Mock *data* is fine; mock *code/behavior* is not.

4. **See it work end-to-end.** Every implemented feature must be runnable against script-seeded data and verified on iOS, Android, and Web before it's considered done.

## What This Means In Practice

| Not allowed (mock code/behavior) | Required instead |
|----------------------------------|------------------|
| `const balance = 10.00; // mock` | Read real `walletBalance` from Firestore |
| `handleX = () => showAlert('coming soon')` | Implement the real handler, or don't show the control |
| `setQuotes([]) // mock until collection exists` | Subscribe to the real `quotes` collection |
| Hardcoded `totalRevenue = 0 // placeholder` | Aggregate from real `walletTransactions` |
| Returning canned data from a service/function | Query/compute from real data sources |
| Fake unlock that just decrements local state | Call the real `unlock` Cloud Function |

| Allowed (mock data only) |
|--------------------------|
| `scripts/seed/*.js` writing realistic users, requests, quotes, chats, notifications to the real DB |
| A backfill/cleanup script that tags rows `seed: true` and removes them later |
| `EXPO_PUBLIC_USE_MOCKS` used **only** to swap real file uploads for placeholder URLs in dev — never to fake feature logic |

## Workflow

1. Implement the real feature (UI + service/hook + Cloud Function as needed).
2. Add/extend a **seed script** to generate the data that feature needs.
3. Run the app against seeded data; verify behavior on all 3 platforms.
4. Use a cleanup script to reset.

## Exceptions

- **Automated tests** may use mocks/stubs/fixtures — that is standard test practice, not application mocking.
- The dev-only `EXPO_PUBLIC_USE_MOCKS` flag may bypass real Storage uploads (cost/speed) using placeholder URLs. It must never fake business logic, auth, payments, or data reads.
- Any other exception must be explicitly approved and documented inline with the reason.

## Checklist (apply on every change)

- [ ] No fake/stub implementations in app code
- [ ] No `coming soon` / `not implemented` handlers shipped
- [ ] No hardcoded placeholder data substituting for real data
- [ ] Real backend wired (Firestore / Cloud Functions)
- [ ] Mock **data** comes only from seed scripts against the real DB
- [ ] Verified working on iOS, Android, and Web

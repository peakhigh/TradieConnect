# Mock Data, Seeding & Cleanup Scripts

Goal: stand up a realistic, fully-populated environment so every screen (customer, tradie, admin, chat, reporting) can be rendered and visually QA'd end-to-end on **iOS, Android, and Web** — then tear it down cleanly.

---

## Existing Scripts (in `/scripts`)

| Script | Purpose |
|--------|---------|
| `populateFirestore.js` | Base seed of users / serviceRequests / quotes |
| `cleanAndPopulate.js` | Wipe + reseed (trades, suburbs, postcodes, statuses, descriptions) |
| `addMoreData.js` | Append extra requests/quotes |
| `checkCounts.js` | Print collection counts (sanity check) |
| `migrate-data.js`, `migrate-simple.js`, `migrate-search-keywords.js` | One-off migrations |
| `updateCustomerIds.js`, `updateStatuses.js` | Field fixups |
| `run.js` | Script runner/entry |

These cover the basics but **predate chat, notifications, intelligence `intel_*` flattening, and reporting rollups**. The plan below extends them.

---

## What a Full Seed Must Cover

To render *all* screens we need coherent, cross-referenced data:

1. **Users**
   - ~10 customers (with names, phones, addresses)
   - ~20 tradies (varied `interestedTrades`, `interestedSuburbs`, ratings, `walletBalance`, `onboardingCompleted: true`, `fcmToken: null`)
   - 1 admin
2. **serviceRequests** — across all statuses (`new`, `quoted`, `assigned`, `completed`, `cancelled`), with flat `intel_*` fields initialized, `tradesLower`, `searchKeywords`, photos (use placeholder Storage URLs or skip with mock flag), spread across the 8 seed suburbs and many trades, dated across the last 90 days (so reporting trends have shape).
3. **quotes** — multiple per request with realistic `unlocked`/`quoted`/`accepted`/`rejected` lifecycle, varied `totalPrice`/`materialsCost`/`laborCost`/`timelineDays`, so intelligence + reporting aggregates are non-trivial.
4. **walletTransactions** — bonus + recharge + unlock rows per tradie.
5. **chatRooms + messages** — at least one room per quoted request, seeded with a `quote` message, a couple of `text` messages, a `system` message, and some with unread counts so badges show.
6. **notifications** — a mix of read/unread per user and types (`chat_message`, `new_quote`, `quote_accepted`) so the feed and badges render.
7. **Reporting rollups** — `suburbTradeStats`, `suburbStats`, `tradeStats`, `suburbAdjacency` (either seeded directly or produced by running the backfill against the seeded requests/quotes).

> Date spread is important: reporting trend charts and "posted within" filters look empty if everything is created "now". Spread `createdAt` across 90 days using a helper like the existing `randomDate()`.

---

## New / Updated Scripts to Add

| Script | Purpose |
|--------|---------|
| `scripts/seed/seedUsers.js` | Customers, tradies, admin |
| `scripts/seed/seedRequestsAndQuotes.js` | Requests + quotes with full lifecycle + `intel_*` + date spread |
| `scripts/seed/seedChat.js` | `chatRooms` + `messages` (quote/text/system, unread variety) |
| `scripts/seed/seedNotifications.js` | Read/unread notifications across types |
| `scripts/seed/seedAll.js` | Orchestrator: runs the above in dependency order |
| `scripts/backfillReportingRollups.js` | Build `suburbTradeStats`/`suburbStats`/`tradeStats` from seeded data (reused in prod backfill) |
| `scripts/buildSuburbAdjacency.js` | Build `suburbAdjacency` from an AU suburb/postcode dataset |
| `scripts/clean/cleanAll.js` | Delete all seeded docs from every collection (batched) |
| `scripts/clean/cleanCollection.js <name>` | Delete a single collection |

### Conventions
- All scripts read Firebase config from `.env` (matching `cleanAndPopulate.js`).
- **Guardrail:** refuse to run `clean*` against a project whose `projectId` doesn't match an allowlist, or require a `--yes` flag + typed confirmation, to avoid wiping the live `tradie-mate-f852a` project by accident. Cleanups are destructive — treat as high-risk.
- Tag every seeded doc with `seed: true` (and a `seedBatch` id). Cleanup deletes only `where('seed','==', true)` so it never removes real data. This is safer than deleting whole collections.
- Use `writeBatch` (≤ 500 ops/batch) and chunk large seeds.
- Prefer the **Firebase emulator** for local dev (`EXPO_PUBLIC_LOCAL_FIRESTORE=true`) so seeding/cleanup never touches prod.

### npm scripts to add (`package.json`)
```json
"seed:all": "node scripts/seed/seedAll.js",
"seed:reset": "node scripts/clean/cleanAll.js --yes && node scripts/seed/seedAll.js",
"seed:rollups": "node scripts/backfillReportingRollups.js",
"seed:adjacency": "node scripts/buildSuburbAdjacency.js",
"clean:all": "node scripts/clean/cleanAll.js"
```

---

## Mock File Uploads (photos / voice / documents)

Real Storage uploads slow seeding and cost money. Wire the existing `EXPO_PUBLIC_USE_MOCKS` feature flag (already in `featureFlags.ts`) so:
- Seed scripts insert **placeholder URLs** (e.g. picsum/Storage public sample) instead of uploading.
- `PostRequestScreen` / chat attachments skip real uploads in dev and use a fake URL (BuildOn "Mock file uploads" pattern — see `pending-tasks.md`).

---

## Rendering / QA Pass

After `npm run seed:all` (against emulator or a dev project):

1. Launch web (`npm run web`) + a native build, log in as each role.
2. Walk every screen and confirm it renders with data:
   - Customer: Dashboard, PostRequest, History, Messages (chat list + window), Profile
   - Tradie: Dashboard, Explorer (locked/unlocked cards + intelligence), SubmitQuote, History, Wallet, Insights/reporting screens, Messages
   - Admin: AdminDashboard
3. Verify badges (unread chat/notifications), filters/drawers (right-slide), confirmations (cross-platform modal), charts (web + native).
4. `npm run clean:all` and confirm screens fall back to correct empty states (`EmptyState`).

A short checklist version of this lives as a task in `tasks.md`.

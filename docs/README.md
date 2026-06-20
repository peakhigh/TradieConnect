# TradieConnect Documentation

Index of design and planning docs. The interactive viewer is `index.html` (open in a browser); the canonical, maintainable source is the individual markdown files below.

## Planning & Architecture

| Doc | What's inside |
|-----|---------------|
| [`tasks.md`](./tasks.md) | **Master build task list** for completing the customer & tradie modules (chat, notifications, intelligence, reporting, seeding). |
| [`tasks-customer-module.md`](./tasks-customer-module.md) | **Customer module** completion tasks (from a code scan). |
| [`tasks-tradie-module.md`](./tasks-tradie-module.md) | **Tradie module** completion tasks (from a code scan). |
| [`tasks-app-common.md`](./tasks-app-common.md) | **App-common** tasks: services, navigation, backend functions, admin, indexes, cleanup. |
| [`chat-plan.md`](./chat-plan.md) | Chat & messaging plan — room-per-quote, BuildOn reuse map, message types, contacts list, Cloud Function behavior. |
| [`notifications-plan.md`](./notifications-plan.md) | Push + in-app notifications — permission/token lifecycle, BuildOn reuse, field-name alignment, dedup, routing. |
| [`tradie-reporting.md`](./tradie-reporting.md) | Tradie reporting/insights — rollup DB design, Firestore-limit mitigations, screens, charts, capability mapping. |
| [`intelligence-algorithm.md`](./intelligence-algorithm.md) | Market intelligence computed on write, stored as flat `intel_*` fields on `serviceRequests` (root level). |
| [`mock-data-and-scripts.md`](./mock-data-and-scripts.md) | Seeding & cleanup scripts, mock uploads, full-render QA pass. |
| [`firebase-indexes-explorer.md`](./firebase-indexes-explorer.md) | Explorer query indexes. |
| [`project-skeleton.md`](./project-skeleton.md) | Reusable project setup derived from BuildOn. |
| [`reusability-framework.md`](./reusability-framework.md) | Cross-project module reuse strategy. |
| [`pending-tasks.md`](./pending-tasks.md) | Running backlog of BuildOn patterns still to port. |

## Conventions (see `.kiro/steering/`)

- All UI works on **iOS, Android, Web** from one codebase (Gluestack UI + NativeWind + Styled Components).
- Drawers slide from the **right**; confirmations use the cross-platform `Modal` pattern (never `Alert.alert` / `window.confirm`).
- Sensitive operations (money, contact sharing, quote lifecycle) go through **callable Cloud Functions**.
- Market intelligence is **pre-computed on write**, never aggregated at read time.

> **Reuse first:** BuildOn (`_buildon/` symlink) is the most mature sibling project. Check it before building chat, notifications, auth, or dashboard features.

# UI Interaction Rules

These rules are mandatory for **every code change across all screens and modules**. They guarantee a consistent, cross-platform experience on **iOS, Android, and Web** from a single codebase. Apply them whenever you build or modify UI.

## 1. Drawers — Always Slide From Right to Left

Every drawer (filters, details, help, menus, etc.) opens from the **right edge** and slides **toward the left**. Never open drawers from the left, top, or bottom.

- Use the shared right-sliding drawer pattern (e.g. `FilterDrawer`, `RequestDetailsDrawer`, `HelpDrawer`).
- The backdrop dims the rest of the screen and dismisses the drawer on press.
- The drawer must be responsive: full-width on small screens, fixed max-width panel on larger/web screens.

```tsx
// Drawer animates in from the right
<Animated.View style={[styles.drawer, { right: 0, transform: [{ translateX }] }]}>
  {/* content */}
</Animated.View>
```

## 2. Dropdowns — Open Directly Beneath the Trigger

All dropdowns / select popups open in a popup positioned **immediately underneath** the triggering element, aligned to its left edge and matching its width where practical.

- Anchor the popup to the trigger's measured position; do not center it on screen.
- The popup must flip above the trigger only if there is not enough space below (edge case), otherwise always below.
- Works identically on iOS, Android, and Web — measure layout with `onLayout` / `measureInWindow` rather than CSS-only positioning.

## 3. Confirmations (OK / Cancel) — Always Use Cross-Platform Modals

For **all** OK & Cancel confirmations, destructive actions, and informational popups, use a React Native `Modal` with a custom card layout. This is responsive and works in all builds (iOS, Android, Web).

- **NEVER** use `Alert.alert()` — unreliable on web.
- **NEVER** use `window.confirm()` / `window.alert()` — break on native.
- Use `transparent`, `animationType="fade"`, backdrop dismiss, and `onRequestClose` for Android back support.
- "Go Back" / "Cancel" is the secondary (left) button; the confirm action is the primary (right, colored) button.

See `.kiro/steering/modal-pattern.md` for the full required pattern, styles, and color conventions.

## 4. Build UI With Gluestack UI + Styled Components Only

Always design UI components using **Gluestack UI primitives** and **Styled Components**. They must be **responsive** and work on iOS, Android, and Web.

- Do not introduce any new UI libraries.
- Reuse components from `/app/components/UI/` and `/app/commonComponents/` before building new ones.
- Avoid `Platform.OS` branches unless there is genuinely no cross-platform alternative (and document why).
- Layout and spacing via NativeWind/Tailwind classes; interactive elements via Gluestack; complex custom styling via Styled Components.
- Every component must be responsive across phone, tablet, and web widths.

## Quick Checklist (apply on every UI change)

- [ ] Drawers slide in from the right
- [ ] Dropdowns open directly beneath their trigger
- [ ] OK/Cancel confirmations use the cross-platform `Modal` pattern (no `Alert.alert` / `window.confirm`)
- [ ] Built with Gluestack UI + Styled Components, no new UI libraries
- [ ] Verified responsive on iOS, Android, and Web

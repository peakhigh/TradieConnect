/**
 * Shared testID builders — single source of truth for E2E selectors.
 * Mirrors the derivation in the shared components (Button/SimpleButton/Input,
 * BottomTabBar, WebSidebar). See docs/e2e-regression-testing.md §4b.
 */
export const slug = (s: string): string =>
  (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const testids = {
  button: (title: string) => `btn-${slug(title)}`,
  input: (label: string) => `input-${slug(label)}`,
  inputField: (label: string) => `input-${slug(label)}-input`,
  inputError: (label: string) => `input-${slug(label)}-error`,
  tab: (route: string) => `tab-${route}`,
  nav: (route: string) => `nav-${route}`,
  signOut: 'nav-sign-out',
  card: (entity: string, id: string) => `card-${entity}-${id}`,
  action: (action: string, id: string) => `action-${action}-${id}`,
} as const;

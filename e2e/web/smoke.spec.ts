/**
 * Smoke test (web) — proves the harness is wired: the app loads under the
 * emulator env and the login screen renders its phone-OTP controls.
 * Prereqs: emulators + seeded + web served with .env.e2e.
 */
import { test, expect } from '@playwright/test';
import { testids } from '../support/testids';

test.describe('smoke', () => {
  test('login screen renders phone + send-OTP controls', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId(testids.inputField('Mobile Number'))).toBeVisible();
    await expect(page.getByTestId(testids.button('Send OTP'))).toBeVisible();
  });
});

/**
 * Phase 3 — Auth (web). Paths A1, A4. Phone-OTP via the Auth emulator's fixed
 * test code. DATA half asserted via firebase-admin.
 * Prereqs: emulators + seeded + web served with .env.e2e; Auth-emulator test
 * numbers configured (see e2e/README.md).
 */
import { test, expect } from '@playwright/test';
import { loginWithPhone } from './helpers';
import { testids } from '../support/testids';
import { USERS } from '../support/fixtures';
import { assertAuthUserByPhone, assertDocExists } from '../support/assertData';

test.describe('A - auth (phone OTP)', () => {
  // A1 — seeded customer logs in and lands in customer tabs.
  test('A1: customer logs in with phone + OTP and reaches the customer app', async ({ page }) => {
    // DATA precondition: the customer exists in Auth + Firestore.
    await assertAuthUserByPhone(USERS.customer.e164).catch(() => {
      test.skip(true, 'customer Auth user not present — configure Auth-emulator test numbers');
    });
    await assertDocExists('users', USERS.customer.uid, { userType: 'customer' });

    await loginWithPhone(page, USERS.customer.phone);

    // Customer shell: the dashboard tab is present, login control gone.
    await expect(page.getByTestId(testids.tab('Dashboard'))).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(testids.button('Send OTP'))).toHaveCount(0);
  });

  // A4 — invalid OTP shows an error and does not log in.
  test('A4: wrong OTP shows an error and does not log in', async ({ page }) => {
    await loginWithPhone(page, USERS.customer.phone, '000000');
    await expect(page.getByText(/invalid otp|try again/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId(testids.button('Verify & Login'))).toBeVisible();
  });
});

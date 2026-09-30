/**
 * Shared Playwright helpers for TradieConnect web specs.
 * Uses stable testIDs + URL routing. Phone-OTP login relies on the Auth
 * emulator's fixed test code (E2E_OTP).
 */
import { Page, expect } from '@playwright/test';
import { testids } from '../support/testids';
import { E2E_OTP } from '../support/fixtures';

/** Log in via phone + OTP. Assumes the phone is an Auth-emulator test number. */
export async function loginWithPhone(page: Page, phone: string, otp = E2E_OTP): Promise<void> {
  await page.goto('/login');
  // LoginScreen: Input "Mobile Number" -> Button "Send OTP" -> Input
  // "Verification Code" -> Button "Verify & Login".
  await page.getByTestId(testids.inputField('Mobile Number')).fill(phone);
  await page.getByTestId(testids.button('Send OTP')).click();
  await page.getByTestId(testids.inputField('Verification Code')).fill(otp);
  await page.getByTestId(testids.button('Verify & Login')).click();
}

/** Navigate directly by URL (TradieConnect uses real routing). */
export async function goto(page: Page, path: string): Promise<void> {
  await page.goto(path);
}

/** Sign out via the sidebar. */
export async function logout(page: Page): Promise<void> {
  await page.getByTestId(testids.signOut).click();
}

export async function expectFieldError(page: Page, label: string, contains?: string): Promise<void> {
  const err = page.getByTestId(testids.inputError(label));
  await expect(err).toBeVisible();
  if (contains) await expect(err).toContainText(contains);
}

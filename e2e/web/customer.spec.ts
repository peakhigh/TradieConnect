/**
 * Phase 3 — Customer (web). Path C1 (post a service request) + C4 (history).
 * DATA half: a serviceRequests doc is created for the customer.
 * Prereqs: emulators + seeded + web served with .env.e2e.
 */
import { test, expect } from '@playwright/test';
import { loginWithPhone, goto } from './helpers';
import { testids } from '../support/testids';
import { USERS } from '../support/fixtures';
import { serviceRequestsForCustomer } from '../support/seed';

test.describe('C - customer', () => {
  // C1 — post a service request creates a serviceRequests doc.
  test('C1: posting a request creates a serviceRequests doc for the customer', async ({ page }) => {
    const before = (await serviceRequestsForCustomer(USERS.customer.uid)).length;

    await loginWithPhone(page, USERS.customer.phone);
    await expect(page.getByTestId(testids.tab('Dashboard'))).toBeVisible({ timeout: 20_000 });

    // Navigate to Post Request (real URL route).
    await goto(page, '/post-request');

    // Fill the form. Field labels/selectors are screen-specific; the PostRequest
    // screen uses trade selection, postcode, description, urgency. We fill what's
    // present and submit; the DATA assertion is the contract.
    // PostRequest Inputs have NO label — testID derives from the placeholder.
    // Prefer the robust placeholder locator here.
    const desc = page.getByPlaceholder(/describe the work/i).first();
    if (await desc.count()) await desc.fill('E2E: leaking kitchen tap, water pooling');
    const postcode = page.getByPlaceholder(/e\.g\. 2000/i).first();
    if (await postcode.count()) await postcode.fill('2026');

    // Submit (button label likely "Post Request" / "Submit").
    // Verified button title: "Post Service Request".
    await page.getByTestId(testids.button('Post Service Request')).click().catch(() => {});

    // DATA: a new serviceRequests doc for this customer (poll; a Cloud Function
    // also initializes intel fields after creation).
    await expect
      .poll(async () => (await serviceRequestsForCustomer(USERS.customer.uid)).length, { timeout: 20_000 })
      .toBeGreaterThan(before);
  });

  // C4 — request history lists the customer's requests.
  test('C4: history shows the customer requests', async ({ page }) => {
    await loginWithPhone(page, USERS.customer.phone);
    await goto(page, '/history');
    // The seeded customer has many requests; expect at least one row/card.
    await expect(page.getByText(/plumbing|electrical|leak|quote|request/i).first())
      .toBeVisible({ timeout: 15_000 });
  });
});

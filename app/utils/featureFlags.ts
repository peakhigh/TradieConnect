/**
 * Feature flags driven by EXPO_PUBLIC_* env vars (set in .env.local).
 *
 * Naming matches the BuildOn project so the same flags behave consistently
 * across the marketplace projects. `EXPO_PUBLIC_LOCAL_USE_MOCKS` is the
 * canonical mock flag; `EXPO_PUBLIC_USE_MOCKS` is still honored for backward
 * compatibility with older tradie-app configs.
 */
const isTrue = (value: string | undefined) => value === 'true';

export const featureFlags = {
  // Use in-memory / placeholder mocks instead of real Firebase calls.
  useMocks:
    isTrue(process.env.EXPO_PUBLIC_LOCAL_USE_MOCKS) ||
    isTrue(process.env.EXPO_PUBLIC_USE_MOCKS),
  // Skip phone OTP reCAPTCHA during local testing.
  skipCaptcha: isTrue(process.env.EXPO_PUBLIC_SKIP_CAPTCHA),
  // Pre-fill forms with test data.
  autofill: isTrue(process.env.EXPO_PUBLIC_AUTOFILL),
  // Suppress toast/alert popups (useful for automated tests).
  skipToasts: isTrue(process.env.EXPO_PUBLIC_SKIP_TOASTS),
  // Allow destructive "delete my data" actions in non-prod builds.
  enableDeleteData: isTrue(process.env.EXPO_PUBLIC_ENABLE_DELETE_DATA),
};

export type FeatureFlags = typeof featureFlags;

export const featureFlags = {
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS === 'true',
  skipCaptcha: process.env.EXPO_PUBLIC_SKIP_CAPTCHA === 'true',
  autofill: process.env.EXPO_PUBLIC_AUTOFILL === 'true',
  skipToasts: process.env.EXPO_PUBLIC_SKIP_TOASTS === 'true',
};

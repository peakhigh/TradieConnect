import { Platform } from 'react-native';
import { isDev, isWeb } from '../utils/helpers';

/**
 * Crashlytics helper — only active on native production builds.
 * No-op on web and in development.
 */

export async function initCrashlytics(uid: string, attributes?: Record<string, string>) {
  if (isWeb() || isDev()) return;

  try {
    const crashlytics = (await import('@react-native-firebase/crashlytics')).default;
    await crashlytics().setUserId(uid);
    if (attributes) {
      await crashlytics().setAttributes(attributes);
    }
  } catch (error) {
    // Expected to fail in Expo Go
    console.log('Crashlytics not available:', error);
  }
}

export function logError(error: Error | string) {
  if (isWeb() || isDev()) {
    console.error('[Crashlytics]', error);
    return;
  }

  try {
    const crashlytics = require('@react-native-firebase/crashlytics').default;
    if (error instanceof Error) {
      crashlytics().recordError(error);
    } else {
      crashlytics().recordError(new Error(String(error)));
    }
  } catch {
    // Crashlytics not available
  }
}

export function logInfo(message: string) {
  if (isWeb()) return;

  try {
    const crashlytics = require('@react-native-firebase/crashlytics').default;
    crashlytics().log(message);
  } catch {
    // Crashlytics not available
  }
}

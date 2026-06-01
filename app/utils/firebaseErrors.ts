export function parseFirebaseError(error: any): string {
  const code = error?.code || '';
  const errorMap: Record<string, string> = {
    'auth/invalid-phone-number': 'Invalid phone number',
    'auth/missing-phone-number': 'Missing phone number',
    'auth/quota-exceeded': 'Too many attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled',
    'auth/invalid-verification-code': 'Invalid verification code',
    'auth/invalid-credential': 'Invalid credentials',
    'permission-denied': 'You do not have permission to perform this action',
    'not-found': 'The requested resource was not found',
    'already-exists': 'This resource already exists',
    'failed-precondition': error?.message || 'Operation cannot be performed',
    'unauthenticated': 'Please sign in to continue',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'internal': 'An unexpected error occurred. Please try again.',
  };
  return errorMap[code] || error?.message || 'Something went wrong. Please try again.';
}

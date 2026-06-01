import { functions, httpsCallable } from './firebase';
import { parseFirebaseError } from '../utils/firebaseErrors';

/**
 * Wrapper for calling Firebase Cloud Functions.
 * Handles error parsing and debug logging.
 */
export async function runCloudFunction<T = any>(functionName: string, data?: any): Promise<T> {
  const fn = httpsCallable(functions, functionName);
  try {
    console.log(`[CF] Calling: ${functionName}`, data?.collectionName || '');
    const result = await fn(data);
    console.log(`[CF] Result: ${functionName}`, 
      Array.isArray((result.data as any)?.data) 
        ? `${(result.data as any).data.length} rows` 
        : 'ok'
    );
    return (result.data as any) as T;
  } catch (error: any) {
    console.error(`[CF] Error: ${functionName}`, error.code, error.message);
    const friendlyMessage = parseFirebaseError(error);
    throw new Error(friendlyMessage);
  }
}

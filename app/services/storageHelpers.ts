import { ref, deleteObject, getDownloadURL, storage } from './firebase';

/**
 * Delete a file from Firebase Storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

/**
 * Get download URL for a file in Firebase Storage.
 */
export async function getFileURL(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

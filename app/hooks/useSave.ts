import { useState } from 'react';
import {
  db,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  doc,
} from '../services/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Recursively remove undefined values from an object.
 * Firestore rejects documents containing undefined values.
 * Preserves Firestore FieldValue sentinels (serverTimestamp, etc.) and Timestamp objects.
 */
function stripUndefined(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }
  // Preserve Firestore FieldValue sentinels (serverTimestamp, increment, etc.)
  if (obj._methodName || obj.type === 'serverTimestamp' || obj._toFieldTransform) {
    return obj;
  }
  // Preserve Firestore Timestamp objects
  if (typeof obj.toDate === 'function') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] =
        typeof value === 'object' && value !== null && !(value instanceof Date)
          ? stripUndefined(value)
          : value;
    }
  }
  return cleaned;
}

export function useSave(collectionName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const collectionRef = collection(db, collectionName);

  const addDocument = async (data: Record<string, any>) => {
    setLoading(true);
    setError(null);

    try {
      const createdAt = serverTimestamp();
      const docData = stripUndefined({
        ...data,
        createdAt,
        updatedAt: createdAt,
        createdBy: user?.id || null,
      });

      const addedDoc = await addDoc(collectionRef, docData);
      setLoading(false);
      return addedDoc;
    } catch (err: any) {
      console.error('useSave addDocument error:', err);
      setError(err.message || 'Failed to add document');
      setLoading(false);
      throw err;
    }
  };

  const updateDocument = async (id: string, data: Record<string, any>) => {
    setLoading(true);
    setError(null);

    try {
      const docRef = doc(collectionRef, id);
      const updatedData = stripUndefined({
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: user?.id || null,
      });

      await updateDoc(docRef, updatedData);
      setLoading(false);
      return { id, ...updatedData };
    } catch (err: any) {
      console.error('useSave updateDocument error:', err);
      setError(err.message || 'Failed to update document');
      setLoading(false);
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const docRef = doc(collectionRef, id);
      await deleteDoc(docRef);
      setLoading(false);
    } catch (err: any) {
      console.error('useSave deleteDocument error:', err);
      setError(err.message || 'Failed to delete document');
      setLoading(false);
      throw err;
    }
  };

  return { addDocument, updateDocument, deleteDocument, loading, error };
}

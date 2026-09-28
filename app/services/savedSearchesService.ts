/**
 * savedSearchesService — CRUD for a tradie's saved searches / job alerts.
 *
 * A saved search captures a filter combo (trades + suburbs/postcodes + urgency).
 * When `active` is true, the onServiceRequestCreated Cloud Function matches new
 * requests against it and pushes a job alert to the tradie.
 *
 * Collection: savedSearches
 *   { tradieId, name, trades[], suburbs[], urgency[], active, createdAt }
 */
import {
  db,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from './firebase';
import { secureError } from '../utils/logger';

export interface SavedSearch {
  id: string;
  tradieId: string;
  name: string;
  trades: string[];
  suburbs: string[]; // postcodes
  urgency: string[];
  active: boolean;
  createdAt: Date;
}

export interface SavedSearchInput {
  name: string;
  trades: string[];
  suburbs: string[];
  urgency: string[];
  active?: boolean;
}

const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

export async function fetchSavedSearches(tradieId: string): Promise<SavedSearch[]> {
  if (!tradieId) return [];
  try {
    const q = query(
      collection(db, 'savedSearches'),
      where('tradieId', '==', tradieId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        tradieId: data.tradieId || '',
        name: data.name || 'Saved search',
        trades: data.trades || [],
        suburbs: data.suburbs || [],
        urgency: data.urgency || [],
        active: data.active ?? true,
        createdAt: toDate(data.createdAt),
      } as SavedSearch;
    });
  } catch (error) {
    secureError('Error fetching saved searches:', error);
    return [];
  }
}

export async function createSavedSearch(
  tradieId: string,
  input: SavedSearchInput
): Promise<string | null> {
  if (!tradieId) return null;
  try {
    // Store trades lowercased so the server match is case-insensitive.
    const ref = await addDoc(collection(db, 'savedSearches'), {
      tradieId,
      name: input.name.trim() || 'Saved search',
      trades: (input.trades || []).map((t) => t.toLowerCase()),
      suburbs: input.suburbs || [],
      urgency: input.urgency || [],
      active: input.active ?? true,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    secureError('Error creating saved search:', error);
    throw error;
  }
}

export async function toggleSavedSearch(searchId: string, active: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'savedSearches', searchId), { active });
  } catch (error) {
    secureError('Error toggling saved search:', error);
    throw error;
  }
}

export async function deleteSavedSearch(searchId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'savedSearches', searchId));
  } catch (error) {
    secureError('Error deleting saved search:', error);
    throw error;
  }
}

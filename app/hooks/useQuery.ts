import { useEffect, useState } from 'react';
import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from '../services/firebase';

type WhereClause = [string, any, any];
type OrderByClause = [string, 'asc' | 'desc'];

/**
 * Simple real-time subscription hook.
 * Subscribes to a Firestore query and returns live-updating documents.
 */
export function useQuery<T = any>(
  collectionName: string,
  wheres?: WhereClause[],
  orderBys?: OrderByClause[],
  limitCount?: number
) {
  const [documents, setDocuments] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ref: any = collection(db, collectionName);

    if (wheres) {
      wheres.filter(w => w.length > 0).forEach((whereClause) => {
        ref = query(ref, where(...whereClause));
      });
    }

    if (orderBys) {
      orderBys.forEach((ob) => {
        ref = query(ref, orderBy(...ob));
      });
    }

    if (limitCount) {
      ref = query(ref, limit(limitCount));
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: any) => {
        const results: any[] = [];
        snapshot.docs.forEach((doc: any) => {
          results.push({ ...doc.data(), id: doc.id });
        });
        setDocuments(results);
        setError(null);
      },
      (err: any) => {
        console.error('useQuery error:', err);
        setError('Could not fetch the data');
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(wheres), JSON.stringify(orderBys), limitCount]);

  return { documents, error };
}

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  startAfter,
  getCountFromServer,
} from '../services/firebase';
import {
  QueryConstraint,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';

type WhereClause = [string, any, any]; // [field, operator, value]
type OrderByClause = [string, 'asc' | 'desc'];

interface UseFetchDocsParams {
  collectionName: string;
  wheres?: WhereClause[];
  orderBys?: OrderByClause[];
  limitCount?: number;
  subscribe?: boolean;
  page?: number;
}

interface UseFetchDocsResult<T = DocumentData> {
  documents: T[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refresh: () => void;
}

function getDocsFromSnapshot(snapshot: QuerySnapshot<DocumentData>) {
  const results: any[] = [];
  snapshot.docs.forEach((doc) => {
    results.push({ ...doc.data(), id: doc.id });
  });
  return results;
}

export function useFetchDocs<T = DocumentData>({
  collectionName,
  wheres = [],
  orderBys = [['createdAt', 'desc']],
  limitCount = 10,
  subscribe = false,
  page = 1,
}: UseFetchDocsParams): UseFetchDocsResult<T> {
  const [documents, setDocuments] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const lastVisibleRef = useRef<DocumentSnapshot | null>(null);

  const refresh = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
    lastVisibleRef.current = null;
  }, []);

  // Serialize params for dependency comparison
  const wheresKey = JSON.stringify(wheres);
  const orderBysKey = JSON.stringify(orderBys);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isCancelled = false;

    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);

      try {
        const collectionRef = collection(db, collectionName);

        // Build query constraints
        const constraints: QueryConstraint[] = [];

        // Add where clauses
        for (const [field, operator, value] of wheres) {
          constraints.push(where(field, operator, value));
        }

        // Add orderBy clauses
        for (const [field, direction] of orderBys) {
          constraints.push(orderBy(field, direction));
        }

        // Handle pagination with startAfter
        if (page > 1 && lastVisibleRef.current) {
          constraints.push(startAfter(lastVisibleRef.current));
        }

        // Add limit
        constraints.push(limit(limitCount));

        const q = query(collectionRef, ...constraints);

        if (subscribe) {
          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              if (isCancelled) return;
              const results = getDocsFromSnapshot(snapshot);
              setDocuments(results as T[]);
              setLoading(false);
              setError(null);
            },
            (err) => {
              if (isCancelled) return;
              console.error('useFetchDocs subscription error:', err);
              setError('Could not fetch the data');
              setLoading(false);
            }
          );
        } else {
          // Get total count (without pagination)
          const countConstraints: QueryConstraint[] = [];
          for (const [field, operator, value] of wheres) {
            countConstraints.push(where(field, operator, value));
          }
          const countQuery = query(collectionRef, ...countConstraints);
          const countSnapshot = await getCountFromServer(countQuery);
          if (!isCancelled) {
            setTotalCount(countSnapshot.data().count);
          }

          // Get documents
          const snapshot = await getDocs(q);
          if (!isCancelled) {
            const results = getDocsFromSnapshot(snapshot);

            // Store last visible for pagination
            if (snapshot.docs.length > 0) {
              lastVisibleRef.current = snapshot.docs[snapshot.docs.length - 1];
            }

            setDocuments(results as T[]);
            setLoading(false);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('useFetchDocs error:', err);
          setError(err.message || 'Could not fetch the data');
          setLoading(false);
        }
      }
    };

    // Reset pagination when page is 1
    if (page === 1) {
      lastVisibleRef.current = null;
    }

    fetchDocuments();

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName, wheresKey, orderBysKey, limitCount, subscribe, page, refreshCounter]);

  return { documents, loading, error, totalCount, refresh };
}

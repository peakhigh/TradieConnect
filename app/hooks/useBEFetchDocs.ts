import { useState, useEffect } from 'react';
import { functions, httpsCallable } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

type WhereClause = [string, string, any];
type OrderByClause = [string, 'asc' | 'desc'];

interface UseBEFetchDocsParams {
  collectionName: string;
  wheres?: WhereClause[];
  orderBys?: OrderByClause[];
  page?: number;
  limitCount?: number;
  ownerFlag?: boolean;
  refreshCounter?: number;
  skipQuery?: boolean;
}

interface UseBEFetchDocsResult<T = any> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch documents via Cloud Functions (server-side queries).
 * More secure than client-side queries — enforces App Check and server-side validation.
 * 
 * Requires a `getDocs` callable Cloud Function on the backend.
 */
export function useBEFetchDocs<T = any>({
  collectionName,
  wheres = [],
  orderBys = [['createdAt', 'desc']],
  page = 1,
  limitCount = 10,
  ownerFlag = false,
  refreshCounter = 0,
  skipQuery = false,
}: UseBEFetchDocsParams): UseBEFetchDocsResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const wheresKey = JSON.stringify(wheres);
  const orderBysKey = JSON.stringify(orderBys);

  useEffect(() => {
    if (skipQuery || !user) {
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const getDocsFn = httpsCallable(functions, 'getDocs');
        const result = await getDocsFn({
          collectionName,
          wheres,
          orderBys,
          page,
          lt: limitCount,
          ownerFlag,
        });

        if (!isCancelled) {
          const responseData = (result as any).data;
          setData(responseData?.data || responseData || []);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error(`useBEFetchDocs error (${collectionName}):`, err.message);
          setError(err.message || 'Failed to fetch data');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [user, skipQuery, collectionName, wheresKey, orderBysKey, page, limitCount, ownerFlag, refreshCounter]);

  return { data, loading, error };
}

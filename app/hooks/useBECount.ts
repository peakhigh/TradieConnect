import { useState, useEffect } from 'react';
import { runCloudFunction } from '../services/cloudFunctions';
import { useAuth } from '../context/AuthContext';

interface UseBECountParams {
  collectionName: string;
  wheres?: [string, string, any][];
  ownerFlag?: boolean;
  refreshCounter?: number;
  skipQuery?: boolean;
}

/**
 * Hook to get a Firestore document count via Cloud Functions.
 * More efficient than fetching all docs just to count them.
 */
export function useBECount({
  collectionName,
  wheres = [],
  ownerFlag = false,
  refreshCounter = 0,
  skipQuery = false,
}: UseBECountParams) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (skipQuery || !user) {
      setCount(0);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchCount = async () => {
      setLoading(true);
      try {
        const result = await runCloudFunction('getDocs', {
          collectionName,
          wheres,
          countOnly: true,
          ownerFlag,
        });
        if (!isCancelled) {
          setCount(result?.count ?? result?.data?.length ?? 0);
        }
      } catch (err) {
        console.error('[useBECount] error:', collectionName, err);
        if (!isCancelled) setCount(0);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchCount();
    return () => { isCancelled = true; };
  }, [user, skipQuery, collectionName, JSON.stringify(wheres), ownerFlag, refreshCounter]);

  return { count, loading };
}

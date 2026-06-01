import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  getCountFromServer,
} from './firebase';
import { QueryConstraint, DocumentSnapshot } from 'firebase/firestore';

type WhereClause = [string, string, any];
type OrderByClause = [string, 'asc' | 'desc'];

interface QueryBuilderParams {
  collectionName: string;
  wheres?: WhereClause[];
  orderBys?: OrderByClause[];
  limitCount?: number;
  searchText?: string;
  searchField?: string;
  searchMode?: 'lower' | 'tokens';
  lastDoc?: DocumentSnapshot | null;
  firstDoc?: DocumentSnapshot | null;
  direction?: 'forward' | 'backward';
}

/**
 * Builds a Firestore query with automatic handling of:
 * - Multiple where clauses
 * - Inequality field ordering (Firestore requirement)
 * - Search (prefix or token-based)
 * - Pagination (forward/backward)
 */
export function buildQuery({
  collectionName,
  wheres = [],
  orderBys = [['createdAt', 'desc']],
  limitCount,
  searchText,
  searchField,
  searchMode = 'lower',
  lastDoc,
  firstDoc,
  direction = 'forward',
}: QueryBuilderParams) {
  let ref: any = collection(db, collectionName);
  const computedWheres = [...wheres];

  // Add search constraints
  if (searchText && searchField) {
    const searchLower = searchText.toLowerCase();
    if (searchMode === 'tokens') {
      const tokensField = searchField + '_tokens';
      const hasArrayContains = computedWheres.some(w => w[1] === 'array-contains');
      if (!hasArrayContains) {
        computedWheres.push([tokensField, 'array-contains', searchLower]);
      }
    } else {
      const lowerField = searchField + '_lower';
      computedWheres.push([lowerField, '>=', searchLower]);
      computedWheres.push([lowerField, '<=', searchLower + '\uf8ff']);
    }
  }

  // Apply where clauses
  const inequalityOps = ['!=', '<', '<=', '>', '>='];
  const inequalityFields: string[] = [];

  computedWheres.forEach((w) => {
    if (inequalityOps.includes(w[1]) && !inequalityFields.includes(w[0])) {
      inequalityFields.push(w[0]);
    }
    ref = query(ref, where(w[0], w[1], w[2]));
  });

  // Handle orderBy with inequality field requirement
  let finalOrderBys = [...orderBys];
  if (inequalityFields.length >= 1) {
    const firstOrderByField = finalOrderBys[0]?.[0];
    if (!inequalityFields.includes(firstOrderByField)) {
      finalOrderBys = inequalityFields.map(f => [f, 'asc'] as OrderByClause);
    }
  }

  finalOrderBys.forEach((ob) => {
    ref = query(ref, orderBy(ob[0], ob[1]));
  });

  // Apply limit
  if (limitCount && limitCount > 0) {
    ref = query(ref, limit(limitCount));
  }

  // Apply pagination
  if (direction === 'backward' && firstDoc) {
    ref = query(ref, endBefore(firstDoc), limitToLast(limitCount || 10));
  } else if (direction === 'forward' && lastDoc) {
    ref = query(ref, startAfter(lastDoc));
  }

  return ref;
}

/**
 * Get total count for a query (without fetching documents).
 */
export async function getQueryCount(
  collectionName: string,
  wheres: WhereClause[] = []
) {
  let ref: any = collection(db, collectionName);
  wheres.forEach((w) => {
    ref = query(ref, where(w[0], w[1], w[2]));
  });

  const snapshot = await getCountFromServer(ref);
  return snapshot.data().count;
}

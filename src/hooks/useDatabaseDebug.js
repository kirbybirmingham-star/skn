import { useCallback } from 'react';
import {
  debugSelect,
  debugInsert,
  debugUpdate,
  debugDelete
} from '@/lib/databaseDebugHelper';

/**
 * Hook to use database debugging utilities
 * Provides wrapped versions of common database operations with automatic logging
 */
export function useDatabaseDebug() {
  const select = useCallback(
    (table, options = {}) => debugSelect(table, options),
    []
  );

  const insert = useCallback(
    (table, data, options = {}) => debugInsert(table, data, options),
    []
  );

  const update = useCallback(
    (table, id, updates, options = {}) => debugUpdate(table, id, updates, options),
    []
  );

  const delete_ = useCallback(
    (table, id, options = {}) => debugDelete(table, id, options),
    []
  );

  return {
    select,
    insert,
    update,
    delete: delete_
  };
}

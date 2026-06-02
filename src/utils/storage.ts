import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DropRecord } from '../types';

const HISTORY_KEY = 'egg_drop_history';

// ─── Generic helpers ──────────────────────────────────────────────────────────
//
// These are deliberately generic: read/write/delete/update-by-id operations are
// completely data-agnostic. When an API layer is added later, these become the
// local-cache implementation of a generic Repository<T> interface — swap the
// key and type constraint to store any identifiable record.

async function getAll<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T[]) : [];
}

async function prepend<T>(key: string, item: T): Promise<void> {
  const items = await getAll<T>(key);
  await AsyncStorage.setItem(key, JSON.stringify([item, ...items]));
}

async function removeById<T extends { id: string }>(
  key: string,
  id: string,
): Promise<void> {
  const items = await getAll<T>(key);
  await AsyncStorage.setItem(key, JSON.stringify(items.filter((i) => i.id !== id)));
}

async function updateById<T extends { id: string }>(
  key: string,
  id: string,
  changes: Partial<T>,
): Promise<void> {
  const items = await getAll<T>(key);
  await AsyncStorage.setItem(
    key,
    JSON.stringify(items.map((i) => (i.id === id ? { ...i, ...changes } : i))),
  );
}

// ─── Public API — typed to DropRecord ─────────────────────────────────────────

export const getHistory = (): Promise<DropRecord[]> =>
  getAll<DropRecord>(HISTORY_KEY);

export const saveRecord = (record: DropRecord): Promise<void> =>
  prepend<DropRecord>(HISTORY_KEY, record);

export const deleteRecord = (id: string): Promise<void> =>
  removeById<DropRecord>(HISTORY_KEY, id);

export const clearHistory = (): Promise<void> =>
  AsyncStorage.removeItem(HISTORY_KEY);

export const updateRecord = (id: string, changes: Partial<DropRecord>): Promise<void> =>
  updateById<DropRecord>(HISTORY_KEY, id, changes);

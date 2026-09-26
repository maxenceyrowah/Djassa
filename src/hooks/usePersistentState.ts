import { useEffect, useState } from 'react';

const STORAGE_PREFIX = 'djassa:v2:';

/**
 * useState synchronisé avec localStorage. Si le stockage est indisponible
 * (navigation privée, quota), l'application continue de fonctionner en mémoire.
 */
export function usePersistentState<T>(key: string, initialValue: T, migrate?: (stored: T) => T) {
  const storageKey = STORAGE_PREFIX + key;

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return initialValue;
      const parsed = JSON.parse(raw) as T;
      return migrate ? migrate(parsed) : parsed;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // stockage indisponible : on reste en mémoire
    }
  }, [storageKey, value]);

  return [value, setValue] as const;
}

export function clearPersistentState() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

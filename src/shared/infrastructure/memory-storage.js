/** In-memory implementation of the raw StoragePort. Fresh state per instance. */
export function createMemoryStorage() {
  const values = new Map();
  return Object.freeze({
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: (key) => { values.delete(key); },
    keys: () => [...values.keys()].sort(),
  });
}

export const STORAGE_PREFIX = "fc.v1.";
/** Access is lazy: even reading the browser's storage property can throw. */
export function createLocalStorageAdapter(getStorage, prefix = STORAGE_PREFIX) {
  return Object.freeze({
    getItem: (key) => getStorage().getItem(prefix + key),
    setItem: (key, value) => getStorage().setItem(prefix + key, value),
    removeItem: (key) => getStorage().removeItem(prefix + key),
    keys() {
      const storage = getStorage();
      const keys = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(prefix))
          keys.push(key.slice(prefix.length));
      }
      return keys.sort();
    },
  });
}

/**
* @typedef {{getItem(key: string): string|null, setItem(key: string, raw: string): void,
* removeItem(key: string): void, keys(): string[]}} StoragePort
*
* Stable snapshots + Observer. Regular edits degrade to memory; commits are strict.
* Treat loaded objects as immutable (as required by useSyncExternalStore).
*/
export function createStore({ storage, onChange = () => { }, onError = () => { } }) {
  const cache = new Map();
  const listeners = new Map();
  const report = (key, error) => { try {
    onError({ key, error });
  }
  catch { /* Diagnostic observers cannot break data operations. */ } };
  const notify = (key, value, operation) => {
    for (const listener of [...(listeners.get(key) || [])]) {
      try {
        listener(value);
      }
      catch (error) {
        report(key, error);
      }
    }
    try {
      onChange({ key, operation });
    }
    catch (error) {
      report(key, error);
    }
  };
  const serialize = (value) => {
    const raw = JSON.stringify(value);
    if (raw === undefined)
      throw new TypeError("El valor debe ser JSON serializable");
    return raw;
  };
  function load(key, fallback) {
    const cached = cache.get(key);
    if (cached?.pending)
      return cached.deleted ? fallback : cached.value;
    try {
      const raw = storage.getItem(key);
      if (raw === null) {
        cache.delete(key);
        return fallback;
      }
      if (cached?.raw === raw)
        return cached.value;
      const value = JSON.parse(raw);
      cache.set(key, { raw, value });
      return value;
    }
    catch (error) {
      report(key, error);
      return cached && !cached.deleted ? cached.value : fallback;
    }
  }
  function keys() {
    let persisted = [...cache.keys()];
    try {
      persisted = storage.keys();
    }
    catch (error) {
      report(null, error);
    }
    const result = new Set(persisted);
    for (const [key, entry] of cache) {
      if (entry.pending && entry.deleted)
        result.delete(key);
      else if (entry.pending || persisted.includes(key))
        result.add(key);
    }
    return [...result].sort();
  }
  function commit({ set = {}, remove = [] }) {
    // Prepare everything before the first write. Reads must succeed for rollback.
    const writes = Object.entries(set).map(([key, value]) => [key, serialize(value)]);
    const removals = [...new Set(remove)].filter((key) => !Object.hasOwn(set, key));
    const affected = [...removals, ...writes.map(([key]) => key)];
    const previous = new Map(affected.map((key) => [key, storage.getItem(key)]));
    const touched = [];
    try {
      for (const key of removals) {
        storage.removeItem(key);
        touched.push(key);
      }
      for (const [key, raw] of writes) {
        storage.setItem(key, raw);
        touched.push(key);
      }
    }
    catch (cause) {
      const rollbackErrors = [];
      for (const key of touched.reverse()) {
        try {
          const raw = previous.get(key);
          if (raw === null)
            storage.removeItem(key);
          else
            storage.setItem(key, raw);
        }
        catch (error) {
          rollbackErrors.push({ key, error });
        }
      }
      // Never claim atomic durability: localStorage has no native transactions.
      const error = new Error(rollbackErrors.length
        ? "No se pudo importar ni restaurar todos los datos; conservá tu backup y revisá el almacenamiento."
        : "No se pudo importar; tus datos anteriores fueron restaurados.", { cause });
      error.rollbackErrors = rollbackErrors;
      if (rollbackErrors.length)
        for (const key of affected) {
          cache.delete(key);
          notify(key, load(key), "invalidate");
        }
      report(null, error);
      throw error;
    }
    // Publish only after ALL persistent writes have succeeded.
    for (const key of removals)
      cache.delete(key);
    for (const [key, raw] of writes)
      cache.set(key, { raw, value: JSON.parse(raw) });
    for (const key of removals)
      notify(key, undefined, "remove");
    for (const [key] of writes)
      notify(key, load(key), "save");
  }
  return Object.freeze({
    load, keys, commit,
    save(key, value) {
      const raw = serialize(value);
      const entry = { raw, value: JSON.parse(raw), pending: false };
      try {
        storage.setItem(key, raw);
      }
      catch (error) {
        entry.pending = true;
        report(key, error);
      }
      cache.set(key, entry);
      notify(key, entry.value, "save");
    },
    remove(key) {
      try {
        storage.removeItem(key);
        cache.delete(key);
      }
      catch (error) {
        cache.set(key, { pending: true, deleted: true });
        report(key, error);
      }
      notify(key, undefined, "remove");
    },
    subscribe(key, listener) {
      if (typeof listener !== "function")
        throw new TypeError("El observador debe ser una función");
      if (!listeners.has(key))
        listeners.set(key, new Set());
      const group = listeners.get(key);
      group.add(listener);
      return () => { group.delete(listener); if (!group.size && listeners.get(key) === group)
        listeners.delete(key); };
    },
    invalidate(key) {
      const affected = key === null ? new Set([...cache.keys(), ...listeners.keys(), ...keys()]) : [key];
      for (const current of affected) {
        cache.delete(current);
        notify(current, load(current), "external");
      }
    },
  });
}

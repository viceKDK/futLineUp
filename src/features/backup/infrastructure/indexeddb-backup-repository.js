export function createIndexedDbBackupRepository({ indexedDB, dbName = "futbolclub-safety", storeName = "backups" }) {
  if (!indexedDB) throw new Error("IndexedDB no está disponible");
  const ready = new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  const transaction = async (mode, operation) => {
    const db = await ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode), store = tx.objectStore(storeName); let result;
      try { result = operation(store); } catch (error) { reject(error); return; }
      tx.oncomplete = () => resolve(result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error("Transacción cancelada"));
    });
  };
  return Object.freeze({
    ready,
    async list() { const db = await ready; return new Promise((resolve, reject) => { const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); },
    put: (backup) => transaction("readwrite", (store) => store.put(backup)),
    remove: (id) => transaction("readwrite", (store) => store.delete(id)),
  });
}

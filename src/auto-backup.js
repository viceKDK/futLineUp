(function initAutomaticBackups() {
  const DB_NAME = "futbolclub-safety";
  const STORE = "backups";
  const MAX_BACKUPS = 7;
  const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;
  let creating = null;
  let scheduled = null;
  let restoring = false;

  function log(level, message, context) {
    window.fcObservability?.log(level, message, context);
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB no está disponible"));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE))
          db.createObjectStore(STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  const ready = openDatabase();
  ready.catch((error) => {
    log("warn", "Backups automáticos no disponibles", { error });
  });

  async function transaction(mode, operation) {
    const db = await ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let result;
      try {
        result = operation(store);
      } catch (error) {
        reject(error);
        return;
      }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Transacción cancelada"));
    });
  }

  async function list() {
    const db = await ready;
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORE, "readonly")
        .objectStore(STORE)
        .getAll();
      request.onsuccess = () =>
        resolve(
          request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        );
      request.onerror = () => reject(request.error);
    });
  }

  async function prune() {
    const backups = await list();
    const expired = backups.slice(MAX_BACKUPS);
    if (!expired.length) return;
    await transaction("readwrite", (store) => {
      expired.forEach((backup) => store.delete(backup.id));
    });
  }

  async function create(reason = "automatic", { force = false } = {}) {
    if (creating) return creating;
    creating = (async () => {
      const backups = await list();
      const latest = backups[0];
      if (
        !force &&
        latest &&
        Date.now() - new Date(latest.createdAt).getTime() < MIN_INTERVAL_MS
      )
        return latest;
      const exported = window.exportFutbolClubData();
      if (!Object.keys(exported.data).length) return null;
      const payload = window.validateFutbolClubData(exported);
      const bytes = new TextEncoder().encode(
        JSON.stringify(payload),
      ).byteLength;
      if (bytes > window.FC_BACKUP_MAX_BYTES)
        throw new Error("El backup automático supera 5 MB");
      const createdAt = new Date().toISOString();
      const backup = {
        id: `${createdAt}-${crypto.randomUUID()}`,
        createdAt,
        reason,
        bytes,
        release: window.FC_RELEASE || null,
        payload,
      };
      await transaction("readwrite", (store) => store.put(backup));
      await prune();
      log("info", "Backup automático creado", {
        id: backup.id,
        reason,
        bytes,
      });
      window.dispatchEvent(
        new CustomEvent("fc:backup-created", { detail: backup }),
      );
      return backup;
    })();
    try {
      return await creating;
    } catch (error) {
      log("error", "Falló el backup automático", { error, reason });
      throw error;
    } finally {
      creating = null;
    }
  }

  async function restore(id) {
    const backups = await list();
    const target = backups.find((backup) => backup.id === id);
    if (!target) throw new Error("No se encontró el backup automático");
    window.validateFutbolClubData(target.payload);
    await create("before-restore", { force: true });
    restoring = true;
    try {
      window.importFutbolClubData(target.payload, "replace");
      log("info", "Backup automático restaurado", {
        id: target.id,
        createdAt: target.createdAt,
      });
      window.dispatchEvent(
        new CustomEvent("fc:backup-restored", { detail: target }),
      );
      return target;
    } finally {
      restoring = false;
    }
  }

  function schedule() {
    if (restoring || scheduled) return;
    scheduled = setTimeout(async () => {
      scheduled = null;
      try {
        await create("data-change");
      } catch (_) {}
    }, 10_000);
  }

  window.fcBackups = {
    ready,
    list,
    latest: async () => (await list())[0] || null,
    create,
    restore,
  };

  window.addEventListener("fc:data-changed", schedule);
  window.addEventListener("fc:ready", async () => {
    try {
      await create("app-start");
    } catch (_) {}
  });
})();

export function createAutomaticBackupService({ repository, exportData, validate, importData, maxBytes, clock = () => new Date(), idFactory, minIntervalMs = 6 * 60 * 60 * 1000, maxBackups = 7, onEvent = () => {}, logger = () => {} }) {
  let creating = null, restoring = false;
  const bytesOf = (payload) => new TextEncoder().encode(JSON.stringify(payload)).byteLength;
  async function list() { return (await repository.list()).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async function prune() { const backups = await list(); await Promise.all(backups.slice(maxBackups).map((backup) => repository.remove(backup.id))); }
  async function create(reason = "automatic", { force = false } = {}) {
    if (creating) return creating;
    creating = (async () => {
      const latest = (await list())[0];
      if (!force && latest && clock().getTime() - new Date(latest.createdAt).getTime() < minIntervalMs) return latest;
      const exported = exportData();
      if (!Object.keys(exported.data || {}).length) return null;
      const payload = validate(exported), bytes = bytesOf(payload);
      if (bytes > maxBytes) throw new Error("El backup automático supera el límite permitido");
      const createdAt = clock().toISOString(), backup = { id: idFactory(createdAt), createdAt, reason, bytes, payload };
      await repository.put(backup); await prune(); logger("info", "Backup automático creado", { id: backup.id, reason, bytes }); onEvent("created", backup); return backup;
    })();
    try { return await creating; } catch (error) { logger("error", "Falló el backup automático", { error, reason }); throw error; } finally { creating = null; }
  }
  async function restore(id) {
    const target = (await list()).find((backup) => backup.id === id);
    if (!target) throw new Error("No se encontró el backup automático");
    validate(target.payload); await create("before-restore", { force: true }); restoring = true;
    try { importData(target.payload, "replace"); logger("info", "Backup automático restaurado", { id, createdAt: target.createdAt }); onEvent("restored", target); return target; }
    finally { restoring = false; }
  }
  return Object.freeze({ list, latest: async () => (await list())[0] || null, create, restore, isRestoring: () => restoring });
}

export function createBackupScheduler({ backupService, delayMs = 10000, setTimer = setTimeout, clearTimer = clearTimeout, logger = () => {} }) {
  let timer = null;
  const cancel = () => { if (timer != null) clearTimer(timer); timer = null; };
  const schedule = () => {
    if (backupService.isRestoring() || timer != null) return;
    timer = setTimer(async () => { timer = null; try { await backupService.create("data-change"); } catch (error) { logger("warn", "Backup programado falló", { error }); } }, delayMs);
  };
  return Object.freeze({ schedule, cancel });
}

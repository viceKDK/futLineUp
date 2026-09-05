(function initAutomaticBackups() {
  const factories = window.fcBackupFactories;
  if (!factories) {
    window.fcObservability?.log("warn", "Backups automáticos no disponibles", { reason: "core-not-ready" });
    return;
  }
  const logger = (level, message, context) => window.fcObservability?.log(level, message, context);
  let repository;
  try {
    repository = factories.createIndexedDbBackupRepository({ indexedDB: window.indexedDB });
  } catch (error) {
    logger("warn", "Backups automáticos no disponibles", { error });
    return;
  }
  repository.ready.catch((error) => logger("warn", "Backups automáticos no disponibles", { error }));
  const service = factories.createAutomaticBackupService({
    repository,
    exportData: window.exportFutbolClubData,
    validate: window.validateFutbolClubData,
    importData: window.importFutbolClubData,
    maxBytes: window.FC_BACKUP_MAX_BYTES,
    idFactory: (createdAt) => `${createdAt}-${crypto.randomUUID()}`,
    logger,
    onEvent(type, backup) {
      window.dispatchEvent(new CustomEvent(type === "created" ? "fc:backup-created" : "fc:backup-restored", { detail: backup }));
    },
  });
  const scheduler = factories.createBackupScheduler({
    backupService: service,
    logger,
    setTimer: (callback, delay) => window.setTimeout(callback, delay),
    clearTimer: (timer) => window.clearTimeout(timer),
  });
  window.fcBackups = Object.freeze({ ready: repository.ready, list: service.list, latest: service.latest, create: service.create, restore: service.restore });
  window.addEventListener("fc:data-changed", scheduler.schedule);
  window.addEventListener("fc:ready", async () => { try { await service.create("app-start"); } catch { /* logged by service */ } });
})();

export function createCloudBackupService({ remote, localBackup, validate, maxBytes, clock = () => new Date(), syncStamp }) {
  const byteLength = (value) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
  async function requireSession() {
    const session = await remote.session();
    if (!session) throw new Error("Iniciá sesión para sincronizar");
    return session;
  }
  async function upload({ force = false } = {}) {
    const session = await requireSession();
    const payload = localBackup.exportData();
    if (byteLength(payload) > maxBytes) throw new Error("Tus datos superan el límite de sincronización");
    const key = `fc.cloud.lastSyncAt.${session.user.id}`;
    const remoteMeta = await remote.metadata(session.user.id);
    const lastSync = syncStamp.read(key);
    if (!force && remoteMeta?.updatedAt && remoteMeta.updatedAt !== lastSync) {
      const error = new Error("Hay una versión más nueva en la nube. Recuperala o confirmá que querés reemplazarla.");
      error.code = "CLOUD_CONFLICT";
      throw error;
    }
    const updatedAt = await remote.upload(session.user.id, payload);
    syncStamp.write(key, updatedAt);
    return payload;
  }
  async function restoreRemote({ preserveLocal = async () => {} } = {}) {
    const session = await requireSession();
    const data = await remote.download(session.user.id);
    if (!data?.payload) throw new Error("La cuenta todavía no tiene un backup");
    validate(data.payload);
    const localBefore = localBackup.exportData();
    await preserveLocal(localBefore);
    localBackup.importData(data.payload, "replace");
    syncStamp.write(`fc.cloud.lastSyncAt.${session.user.id}`, data.updatedAt || clock().toISOString());
    return { updatedAt: data.updatedAt, localBefore };
  }
  return Object.freeze({ upload, restoreRemote, download: restoreRemote });
}

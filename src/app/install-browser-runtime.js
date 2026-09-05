import { createRuntime } from "./create-runtime.js";
import { createLocalStorageAdapter, STORAGE_PREFIX } from "../shared/infrastructure/local-storage.js";
import { createBase64UrlCodec } from "../shared/infrastructure/base64url.js";
import { FORMATIONS, DEFAULT_ROSTER, DEFAULT_SAVED_TEAMS, DEFAULT_PROFILE } from "../features/lineup/domain/catalog.js";
import { SCHEMA_VERSION, BACKUP_MAX_BYTES } from "../features/backup/domain/backup-schema.js";
import { SHARE_MAX_CHARS } from "../features/sharing/application/snapshot-service.js";
import { fisherYates } from "../features/draw/domain/shuffle.js";
import * as display from "../shared/domain/display.js";
/** The legacy window surface is isolated here, never inside domain/application. */
export function installBrowserRuntime(target) {
  target.fcRuntime?.dispose();
  const emit = (name, detail) => target.dispatchEvent(new target.CustomEvent(name, { detail }));
  const storage = createLocalStorageAdapter(() => target.localStorage);
  if (typeof target.RESET_ON_BOOT === "undefined")
    target.RESET_ON_BOOT = false;
  if (target.RESET_ON_BOOT) {
    try {
      for (const key of storage.keys())
        storage.removeItem(key);
    }
    catch (error) {
      emit("fc:storage-error", { key: null, error });
    }
  }
  // Each browser runtime owns its defaults; tests/sessions cannot mutate each other.
  Object.assign(target, structuredClone({ FORMATIONS, DEFAULT_ROSTER, DEFAULT_SAVED_TEAMS, DEFAULT_PROFILE }), display, {
    FC_SCHEMA_VERSION: SCHEMA_VERSION, FC_BACKUP_MAX_BYTES: BACKUP_MAX_BYTES, FC_SHARE_MAX_CHARS: SHARE_MAX_CHARS, fisherYates,
  });
  const runtime = createRuntime({
    storage, codec: createBase64UrlCodec(), supportsMode: (mode) => Object.hasOwn(target.FORMATIONS, mode),
    onChange: (detail) => emit("fc:data-changed", detail), onError: (detail) => emit("fc:storage-error", detail),
  });
  Object.assign(target, {
    db: runtime.store,
    exportFutbolClubData: runtime.backup.exportData,
    importFutbolClubData: runtime.backup.importData,
    validateFutbolClubData: runtime.backup.validate,
    encodeLineupSnapshot: runtime.snapshots.encode,
    decodeLineupSnapshot: runtime.snapshots.decode,
  });
  for (const [name, key, defaults] of [
    ["ROSTER", "roster", "DEFAULT_ROSTER"], ["SAVED_TEAMS", "teams", "DEFAULT_SAVED_TEAMS"]
  ]) {
    Object.defineProperty(target, name, { configurable: true, get: () => target.db.load(key, target[defaults]) });
  }
  const onStorage = (event) => {
    try {
      if (event.storageArea && event.storageArea !== target.localStorage)
        return;
    }
    catch {
      return;
    }
    if (event.key === null)
      runtime.store.invalidate(null);
    else if (event.key?.startsWith(STORAGE_PREFIX))
      runtime.store.invalidate(event.key.slice(STORAGE_PREFIX.length));
  };
  target.addEventListener("storage", onStorage);
  const installed = Object.freeze({ ...runtime, dispose: () => target.removeEventListener("storage", onStorage) });
  target.fcRuntime = installed;
  return installed;
}

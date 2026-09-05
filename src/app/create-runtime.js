import { createStore } from "../shared/application/store.js";
import { createBackupService } from "../features/backup/application/backup-service.js";
import { createBackupSchema } from "../features/backup/domain/backup-schema.js";
import { createSnapshotService } from "../features/sharing/application/snapshot-service.js";
/** Composition root: the ONLY place that wires application services together. */
export function createRuntime({ storage, codec, supportsMode, clock, onChange, onError, fieldValidators, strategies }) {
  const store = createStore({ storage, onChange, onError });
  const backup = createBackupService({
    reader: store, writer: store, schema: createBackupSchema({ fieldValidators }), clock, strategies
  });
  const snapshots = createSnapshotService({ codec, supportsMode });
  return Object.freeze({ store, backup, snapshots });
}

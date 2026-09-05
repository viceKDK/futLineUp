import { createBackupSchema, SCHEMA_VERSION, BACKUP_MAX_BYTES } from "../domain/backup-schema.js";
import { createRegistry } from "../../../shared/domain/registry.js";
/**
* @typedef {{keys(): string[], load(key: string, fallback?: unknown): unknown}} BackupReader
* @typedef {{commit(plan: {set: Object, remove: string[]}): void}} BackupWriter
* Reader and writer are separate ports; neither depends on the browser.
*/
export function createBackupService({ reader, writer, schema = createBackupSchema(), clock = () => new Date(), strategies = {} }) {
  const policies = createRegistry({
    replace: ({ data, existingKeys }) => ({
      set: data, remove: existingKeys.filter((key) => schema.accepts(key) && !Object.hasOwn(data, key))
    }),
    merge: ({ data }) => ({ set: data, remove: [] }),
  }, strategies);
  return Object.freeze({
    exportData() {
      const data = {};
      for (const key of reader.keys())
        if (schema.accepts(key))
          data[key] = reader.load(key, null);
      return {
        app: "futbolClub", schemaVersion: SCHEMA_VERSION, exportedAt: clock().toISOString(), data
      };
    },
    importData(payload, strategy = "replace") {
      let serialized;
      try {
        serialized = JSON.stringify(payload);
      }
      catch (cause) {
        throw new Error("El backup no es JSON serializable", { cause });
      }
      if (typeof serialized !== "string")
        throw new Error("El backup no es JSON serializable");
      // UTF-8 bytes, not UTF-16 string length (important for names and photos).
      if (new TextEncoder().encode(serialized).byteLength > BACKUP_MAX_BYTES)
        throw new Error("El backup no puede superar 5 MB");
      const validated = schema.validate(payload);
      const policy = policies.get(strategy);
      if (!policy)
        throw new Error("Estrategia de importación inválida");
      const plan = policy({ data: validated.data, existingKeys: reader.keys() });
      writer.commit(plan);
      return Object.keys(validated.data).length;
    },
    validate: schema.validate,
  });
}

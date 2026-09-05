import { validateJsonTree } from "../../../shared/domain/json-tree.js";
import { createRegistry } from "../../../shared/domain/registry.js";
export const SCHEMA_VERSION = 2;
export const BACKUP_MAX_BYTES = 5 * 1024 * 1024;
const json = () => { };
const list = (label, max) => (value) => {
  if (!Array.isArray(value))
    throw new Error(`${label} del backup no es válido`);
  if (value.length > max)
    throw new Error(`El backup supera el límite de ${max}: ${label}`);
};
const DEFAULT_FIELDS = Object.freeze({
  profile: json, roster: list("El plantel", 200), teams: list("Los equipos", 200),
  editor: json, draw: json, currentKit: json, currentKitAlt: json, teamCrests: json,
  customCrestNames: json, rival: json, matches: json, matchInfo: json, shareInclude: json,
  trainingSessions: json, attendance: json, evaluations: json, objectives: json,
  competitions: list("Las competencias", 50), activeCompetitionId: json, league: json, lastBackupAt: json,
});
/** Adding a field means registering a validator, not editing the import algorithm. */
export function createBackupSchema({ fieldValidators = {} } = {}) {
  const fields = createRegistry(DEFAULT_FIELDS, fieldValidators);
  return Object.freeze({
    accepts: fields.has,
    validate(payload) {
      if (!payload || payload.app !== "futbolClub" || !payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
        throw new Error("El archivo no es un backup válido de futbolClub");
      }
      const version = Object.hasOwn(payload, "schemaVersion") ? Number(payload.schemaVersion) : 1;
      if (!Number.isInteger(version) || version < 1 || version > SCHEMA_VERSION)
        throw new Error("El backup usa una versión incompatible");
      const data = {};
      for (const [key, value] of Object.entries(payload.data)) {
        if (!fields.has(key))
          continue;
        validateJsonTree(value);
        fields.get(key)(value);
        data[key] = value;
      }
      if (!Object.keys(data).length)
        throw new Error("El backup no contiene datos reconocidos");
      return { ...payload, schemaVersion: version, data };
    },
  });
}

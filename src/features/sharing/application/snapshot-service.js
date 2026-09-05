import { validateJsonTree } from "../../../shared/domain/json-tree.js";
export const SHARE_MAX_CHARS = 60000;
function tooLarge(message) {
  return Object.assign(new Error(message), { code: "SHARE_TOO_LARGE" });
}
/** Codec and mode policy are replaceable without changing this use case. */
export function createSnapshotService({ codec, supportsMode }) {
  function validate(snapshot) {
    if (
      !snapshot ||
      snapshot.v !== 1 ||
      !snapshot.draft ||
      typeof snapshot.draft !== "object" ||
      Array.isArray(snapshot.draft)
    )
      throw new Error("Alineación compartida inválida");
    validateJsonTree(snapshot);
    if (!supportsMode(Number(snapshot.draft.mode ?? 7)))
      throw new Error("El modo compartido no es válido");
    if (
      Object.hasOwn(snapshot, "roster") &&
      (!Array.isArray(snapshot.roster) || snapshot.roster.length > 100)
    )
      throw new Error("El plantel compartido no es válido");
    return snapshot;
  }
  return Object.freeze({
    encode(snapshot) {
      const value = validate({ ...snapshot, v: 1 });
      const encoded = codec.encode(JSON.stringify(value));
      if (encoded.length > SHARE_MAX_CHARS)
        throw tooLarge(
          "La alineación es demasiado grande para compartirla como enlace",
        );
      return encoded;
    },
    decode(encoded) {
      if (typeof encoded !== "string" || encoded.length > SHARE_MAX_CHARS)
        throw tooLarge("El enlace compartido es demasiado grande");
      return validate(JSON.parse(codec.decode(encoded)));
    },
  });
}

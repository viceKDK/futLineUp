/** Browser/Node adapter. No Buffer dependency in application code. */
export function createBase64UrlCodec() {
  return Object.freeze({
    encode(value) {
      let binary = "";
      for (const byte of new TextEncoder().encode(value))
        binary += String.fromCharCode(byte);
      return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    },
    decode(value) {
      if (!/^[A-Za-z0-9_-]+$/.test(value))
        throw new Error("El enlace compartido no es válido");
      const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
      const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
      return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
    },
  });
}

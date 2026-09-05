export function createSharePorts(target) {
  const navigator = target.navigator;
  return Object.freeze({
    clipboard: {
      async writeText(text) {
        if (!navigator.clipboard?.writeText)
          throw new Error(
            "El portapapeles no está disponible; seleccioná y copiá el enlace",
          );
        await navigator.clipboard.writeText(text);
      },
    },
    nativeShare: {
      available: typeof navigator.share === "function",
      supportsFiles(file) {
        try {
          return !!navigator.canShare?.({ files: [file] });
        } catch {
          return false;
        }
      },
      makeFile: ({ blob, filename }) =>
        new target.File([blob], filename, { type: blob.type }),
      share: (data) => navigator.share(data),
    },
    openExternal(value) {
      const url = new URL(value);
      if (url.protocol !== "https:")
        throw new Error("El enlace externo no es válido");
      target.open(url.href, "_blank", "noopener,noreferrer");
    },
  });
}

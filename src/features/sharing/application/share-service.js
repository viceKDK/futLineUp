import { createRegistry } from "../../../shared/domain/registry.js";

const CHANNELS = Object.freeze({
  whatsapp: ({ text, url }) => ({
    url: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  }),
  telegram: ({ text, url }) => ({
    url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  }),
  twitter: ({ text, url }) => ({
    url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  }),
  instagram: ({ text, url }) => ({
    url: "https://instagram.com/",
    copyText: `${text} ${url}`,
  }),
});

/** Export/channel strategies have no effects until the coordinator invokes a port. */
export function createShareService({
  snapshots,
  exporters,
  download,
  clipboard,
  nativeShare,
  openExternal,
  channels = {},
}) {
  const formats = createRegistry({}, exporters);
  const destinations = createRegistry(CHANNELS, channels);
  async function exportData(format, request) {
    const exporter = formats.get(format);
    if (!exporter) throw new Error("Formato de exportación no disponible");
    return exporter(request);
  }
  return Object.freeze({
    formats: formats.keys,
    createLink(payload, baseUrl) {
      let encoded,
        withoutPhotos = false;
      try {
        encoded = snapshots.encode(payload);
      } catch (error) {
        if (
          error.code !== "SHARE_TOO_LARGE" ||
          !payload.roster?.some((player) => player.photo)
        )
          throw error;
        encoded = snapshots.encode({
          ...payload,
          roster: payload.roster.map((player) => ({ ...player, photo: null })),
        });
        withoutPhotos = true;
      }
      const url = new URL(baseUrl);
      url.hash = `share=${encoded}`;
      return { url: url.href, withoutPhotos };
    },
    async exportFile(format, request) {
      const file = await exportData(format, request);
      await download(file);
      return file.filename;
    },
    async prepareImage(request) {
      return nativeShare.makeFile(await exportData("png", request));
    },
    copyLink: (url) => clipboard.writeText(url),
    async share({ title, text, url, file }) {
      if (!nativeShare.available) {
        await clipboard.writeText(url);
        return "copied";
      }
      const data =
        file && nativeShare.supportsFiles(file)
          ? { title, text: `${text}\n${url}`, files: [file] }
          : { title, text, url };
      try {
        await nativeShare.share(data);
        return "shared";
      } catch (error) {
        if (error.name === "AbortError") return "cancelled";
        throw error;
      }
    },
    async openChannel(name, data) {
      const destination = destinations.get(name);
      if (!destination) throw new Error("Canal de difusión no disponible");
      const action = destination(data);
      // Open synchronously while the initiating gesture still has user activation.
      openExternal(action.url);
      if (action.copyText) await clipboard.writeText(action.copyText);
    },
  });
}

import { createSharePage } from "../features/sharing/presentation/share-page.js";
import { createShareService } from "../features/sharing/application/share-service.js";
import { createBrowserExporters } from "../features/sharing/infrastructure/browser-exporters.js";
import { createDownloadPort } from "../features/sharing/infrastructure/browser-download.js";
import { createSharePorts } from "../features/sharing/infrastructure/browser-share.js";
import { nextFriday } from "../features/sharing/infrastructure/browser-time.js";

/** Migration boundary: only this composition root reads the still-classic app APIs. */
export function mountSharing(target) {
  const root = target.document.getElementById("page-share");
  if (!root) throw new Error("No existe el contenedor de Compartir");
  const snapshots = target.fcRuntime.snapshots;
  const ports = createSharePorts(target);
  const exporters = createBrowserExporters({
    capture(element) {
      if (!target.html2canvas)
        throw new Error("El capturador de imágenes no está disponible");
      return target.html2canvas(element, {
        backgroundColor: "#0e1210",
        scale: 2,
        useCORS: true,
        logging: false,
      });
    },
    pdfFactory: () =>
      target.jspdf?.jsPDF
        ? new target.jspdf.jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
          })
        : null,
    clock: () => new Date(),
    idFactory: () => `${target.crypto.randomUUID()}@futbolclub`,
  });
  const services = createShareService({
    snapshots,
    exporters,
    download: createDownloadPort(target),
    ...ports,
  });
  const address = {
    hash: () => target.location.hash,
    baseUrl: () =>
      `${target.location.origin}${target.location.pathname}${target.location.search}`,
    visible: () => root.classList.contains("active"),
    subscribe(listener) {
      target.addEventListener("hashchange", listener);
      target.addEventListener("popstate", listener);
      const observer = new target.MutationObserver(listener);
      observer.observe(root, { attributes: true, attributeFilter: ["class"] });
      return () => {
        observer.disconnect();
        target.removeEventListener("hashchange", listener);
        target.removeEventListener("popstate", listener);
      };
    },
  };
  const SharePage = createSharePage({
    React: target.React,
    useStore: target.useStore,
    formations: target.FORMATIONS,
    snapshots,
    services,
    address,
    defaults: {
      roster: target.DEFAULT_ROSTER,
      draft: { name: "Mi equipo", mode: 7, formIdx: 0, assignedIds: [] },
      match: {
        date: nextFriday(new Date()),
        time: "21:30",
        venue: "",
        opponent: "Rival",
        myScore: null,
        theirScore: null,
      },
      include: {
        names: true,
        kit: true,
        venue: true,
        stats: false,
        watermark: true,
      },
    },
    tweaks: {
      read: () => target.fcGetTweaks(),
      set: (key, value) => target.fcSetTweak(key, value),
      subscribe(listener) {
        target.addEventListener("fc:tweak-changed", listener);
        return () => target.removeEventListener("fc:tweak-changed", listener);
      },
    },
    notify: (message) => target.__toast?.(message),
    Pitch: target.Pitch,
    Kit: target.Kit,
    Icon: target.Icon,
    prepareNativeImage: ports.nativeShare.available,
  });
  target.mountPage("page-share", target.React.createElement(SharePage));
}

/** A dynamic import can finish while the document is interactive, before deferred scripts. */
export function startSharing(target, mount = mountSharing) {
  const ready = () =>
    Boolean(
      target.fcRuntime?.snapshots &&
      target.React &&
      target.Pitch &&
      target.Kit &&
      target.Icon &&
      target.mountPage &&
      target.useStore,
    );
  const start = () => {
    try {
      if (!ready())
        throw new Error("Las dependencias de Compartir no se cargaron");
      mount(target);
    } catch (error) {
      target.console.error("[futbolClub] No se pudo iniciar Compartir", error);
      const root = target.document.getElementById("page-share");
      if (root) {
        root.setAttribute("role", "alert");
        root.textContent = "No se pudo abrir Compartir. Recargá la aplicación.";
      }
    }
  };
  if (ready() || target.document.readyState === "complete") start();
  else
    target.document.addEventListener("DOMContentLoaded", start, { once: true });
}

if (typeof window !== "undefined") startSharing(window);

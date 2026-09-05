import { createCalendarEvent } from "../domain/calendar-event.js";
import { localMatchInstant } from "./browser-time.js";

export function canvasBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("No se pudo generar la imagen")),
      "image/png",
    );
  });
}

/** Adapters depend on injected vendor functions, never on a vendor singleton. */
export function createBrowserExporters({
  capture,
  pdfFactory,
  clock,
  idFactory,
  resolveStart = localMatchInstant,
}) {
  async function captureView(element) {
    if (!element) throw new Error("La vista para exportar no está disponible");
    const canvas = await capture(element);
    if (
      !canvas ||
      ![canvas.width, canvas.height].every((v) => Number.isFinite(v) && v > 0)
    ) {
      throw new Error("La captura no tiene dimensiones válidas");
    }
    return canvas;
  }
  return Object.freeze({
    async png({ element, model }) {
      const blob = await canvasBlob(await captureView(element));
      return { blob, filename: `${model.slug}.png` };
    },
    async pdf({ element, model }) {
      const canvas = await captureView(element);
      const pdf = pdfFactory();
      if (!pdf) throw new Error("El exportador PDF no está disponible");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const scale = Math.min(
        (pageWidth - 20) / canvas.width,
        (pageHeight - 20) / canvas.height,
      );
      const width = canvas.width * scale,
        height = canvas.height * scale;
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.9),
        "JPEG",
        (pageWidth - width) / 2,
        (pageHeight - height) / 2,
        width,
        height,
      );
      return { blob: pdf.output("blob"), filename: `${model.slug}.pdf` };
    },
    async ics({ model }) {
      const event = createCalendarEvent({
        startsAt: resolveStart(model.match.date, model.match.time),
        createdAt: clock().toISOString(),
        uid: idFactory(),
        summary: `${model.draft.name} vs ${model.match.opponent}`,
        location: model.include.venue ? model.match.venue : "",
        description: `Formación ${model.formation.name} · Fut ${model.mode} · ${model.players.filter(Boolean).length}/${model.size} jugadores`,
      });
      return {
        blob: new Blob([event], { type: "text/calendar;charset=utf-8" }),
        filename: `${model.slug}.ics`,
      };
    },
  });
}

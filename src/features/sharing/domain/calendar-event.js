import { parseCivilDate } from "../../../shared/domain/civil-date.js";

export function escapeCalendarText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** RFC 5545 section 3.1: fold at UTF-8 boundaries, including the continuation space. */
export function foldCalendarLine(value) {
  const encoder = new TextEncoder();
  let result = "",
    width = 0;
  for (const character of value) {
    const bytes = encoder.encode(character).byteLength;
    if (width + bytes > 75) {
      result += "\r\n ";
      width = 1;
    }
    result += character;
    width += bytes;
  }
  return result;
}

function instant(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
  ) {
    throw new Error("El calendario requiere un instante UTC válido");
  }
  parseCivilDate(value.slice(0, 10));
  const date = new Date(value);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 19) !== value.slice(0, 19)
  ) {
    throw new Error("El calendario requiere un instante UTC válido");
  }
  return date;
}
const stamp = (date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

export function createCalendarEvent({
  startsAt,
  createdAt,
  uid,
  summary,
  location = "",
  description = "",
  durationMinutes = 90,
}) {
  if (typeof uid !== "string" || !/^[A-Za-z0-9._@-]{1,200}$/.test(uid))
    throw new Error("Identificador de evento inválido");
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 10080
  )
    throw new Error("Duración inválida");
  const start = instant(startsAt),
    created = instant(createdAt);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//futbolClub//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp(created)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeCalendarText(summary)}`,
    `LOCATION:${escapeCalendarText(location)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldCalendarLine).join("\r\n") + "\r\n";
}

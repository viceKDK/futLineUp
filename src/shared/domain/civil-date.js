/** Calendar-only values: validation must not silently normalize February 30. */
export function parseCivilDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Fecha inválida");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("Fecha inválida");
  }
  return value.split("-").map(Number);
}

export function parseClockTime(value) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) {
    throw new Error("Hora inválida");
  }
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) throw new Error("Hora inválida");
  return [hours, minutes];
}

export function addCivilDays(value, days) {
  parseCivilDate(value);
  if (!Number.isInteger(days)) throw new Error("Cantidad de días inválida");
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  const result = date.toISOString().slice(0, 10);
  parseCivilDate(result);
  return result;
}

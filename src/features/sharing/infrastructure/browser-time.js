import {
  parseCivilDate,
  parseClockTime,
} from "../../../shared/domain/civil-date.js";

/** Resolve the event in the exporting device's timezone, then encode a fixed UTC instant. */
export function localMatchInstant(date, time) {
  const [year, month, day] = parseCivilDate(date);
  const [hours, minutes] = parseClockTime(time);
  const local = new Date(0);
  local.setFullYear(year, month - 1, day);
  local.setHours(hours, minutes, 0, 0);
  if (
    local.getFullYear() !== year ||
    local.getMonth() !== month - 1 ||
    local.getDate() !== day ||
    local.getHours() !== hours ||
    local.getMinutes() !== minutes
  ) {
    throw new Error(
      "La hora elegida no existe en la zona horaria de este dispositivo",
    );
  }
  return local.toISOString();
}

export function nextFriday(now) {
  const date = new Date(now);
  date.setDate(date.getDate() + ((5 - date.getDay() + 7) % 7 || 7));
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

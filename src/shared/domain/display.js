function luminance(hex, fallback) {
  if (typeof hex !== "string" || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex))
    return fallback;
  let value = hex.slice(1);
  if (value.length === 3)
    value = [...value].map((char) => char + char).join("");
  return (0.299 * parseInt(value.slice(0, 2), 16) + 0.587 * parseInt(value.slice(2, 4), 16) + 0.114 * parseInt(value.slice(4, 6), 16)) / 255;
}
export const contrastText = (hex) => luminance(hex, 0) > 0.6 ? "#12181a" : "#ffffff";
export const contrastTextMixed = (primary, secondary, design) => !design || design === "solid"
  ? contrastText(primary) : (luminance(primary, 1) + luminance(secondary, 1)) / 2 > 0.6 ? "#12181a" : "#ffffff";
export function initials(name) {
  const parts = typeof name === "string" ? name.trim().split(/\s+/).filter(Boolean) : [];
  if (!parts.length)
    return "??";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
}
export function colorFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return `oklch(0.55 0.12 ${hash % 360})`;
}
export function nextPlayerId(roster) {
  return (roster.reduce((max, player) => Math.max(max, Number(player.id) || 0), 0) || 0) + 1;
}
export function relDate(iso, now = Date.now()) {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp))
    return "";
  const days = Math.floor((now - timestamp) / 86400000);
  if (days < 1)
    return "hoy";
  if (days < 2)
    return "ayer";
  if (days < 7)
    return `hace ${days} días`;
  if (days < 30)
    return `hace ${Math.floor(days / 7)} sem`;
  return `hace ${Math.floor(days / 30)} meses`;
}

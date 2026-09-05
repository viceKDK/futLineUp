import { normalizeTeamNames, validateFixtureDraft } from "./fixture.js";
const header = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
export function detectDelimiter(text) {
  const line = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).find((value) => value.trim()) || "";
  const candidates = [",", ";", "\t"], count = Object.fromEntries(candidates.map((value) => [value, 0]));
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '"') { if (quoted && line[i + 1] === '"') i += 1; else quoted = !quoted; }
    else if (!quoted && Object.hasOwn(count, line[i])) count[line[i]] += 1;
  }
  return candidates.sort((a, b) => count[b] - count[a])[0];
}
export function parseRows(text) {
  const clean = String(text || "").replace(/^\uFEFF/, ""), delimiter = detectDelimiter(clean), rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (char === '"') { if (quoted && clean[i + 1] === '"') { value += '"'; i += 1; } else quoted = !quoted; continue; }
    if (!quoted && char === delimiter) { row.push(value.trim()); value = ""; continue; }
    if (!quoted && (char === "\n" || char === "\r")) { if (char === "\r" && clean[i + 1] === "\n") i += 1; row.push(value.trim()); value = ""; if (row.some(Boolean)) rows.push(row); row = []; continue; }
    value += char;
  }
  row.push(value.trim()); if (row.some(Boolean)) rows.push(row); return rows;
}
const indexOf = (headers, aliases) => aliases.map((alias) => headers.indexOf(alias)).find((index) => index >= 0) ?? -1;
export function parseLeagueCsv(text, { id = (index) => `fx-csv-${index}` } = {}) {
  const rows = parseRows(text); if (!rows.length) throw new Error("El CSV está vacío.");
  const headers = rows[0].map(header), body = rows.slice(1);
  const team = indexOf(headers, ["equipo", "team", "nombre", "name", "club"]), home = indexOf(headers, ["local", "home", "equipo_local", "home_team"]), away = indexOf(headers, ["visitante", "away", "equipo_visitante", "away_team"]), date = indexOf(headers, ["fecha", "date", "dia", "day"]), hs = indexOf(headers, ["goles_local", "gol_local", "home_score", "score_home", "resultado_local"]), as = indexOf(headers, ["goles_visitante", "gol_visitante", "away_score", "score_away", "resultado_visitante"]);
  const teams = [], fixtures = [], warnings = [];
  if (home >= 0 && away >= 0) {
    body.forEach((cells, index) => {
      const draft = { home: cells[home], away: cells[away], date: date >= 0 ? cells[date] : "", homeScore: hs >= 0 ? cells[hs] : "", awayScore: as >= 0 ? cells[as] : "" };
      if (!String(draft.home || "").trim() && !String(draft.away || "").trim()) return;
      try { const fixture = validateFixtureDraft(draft); teams.push(fixture.home, fixture.away); fixtures.push({ id: id(index), ...fixture }); }
      catch (error) { warnings.push(`Fila ${index + 2}: ${error.message}.`); }
    });
    return { kind: "fixture", teams: normalizeTeamNames(teams), fixtures, warnings };
  }
  const fallback = team >= 0 ? team : headers.length === 1 ? 0 : -1;
  if (fallback < 0) throw new Error("No encontré columnas de equipos. Usá 'Equipo' o 'Local' y 'Visitante'.");
  for (const cells of body) if (String(cells[fallback] || "").trim()) teams.push(cells[fallback]);
  return { kind: "teams", teams: normalizeTeamNames(teams), fixtures: [], warnings };
}

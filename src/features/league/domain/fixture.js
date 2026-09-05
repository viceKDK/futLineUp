function cleanName(value) { return String(value || "").trim(); }

export function normalizeTeamNames(values) {
  const result = [], seen = new Set();
  for (const value of values || []) {
    const name = cleanName(typeof value === "string" ? value : value?.name);
    const key = name.toLocaleLowerCase();
    if (name && !seen.has(key)) { seen.add(key); result.push(name); }
  }
  return result;
}

export function inferTeams(competition) {
  return normalizeTeamNames([...(competition?.teams || []), ...(competition?.fixtures || []).flatMap((fixture) => [fixture?.home, fixture?.away])]);
}

export function validateFixtureDraft(draft) {
  const home = cleanName(draft?.home), away = cleanName(draft?.away), date = cleanName(draft?.date);
  if (!home || !away) throw new Error("Completá ambos equipos");
  if (home.toLocaleLowerCase() === away.toLocaleLowerCase()) throw new Error("Un equipo no puede jugar contra sí mismo");
  const hasHome = draft.homeScore !== "" && draft.homeScore != null;
  const hasAway = draft.awayScore !== "" && draft.awayScore != null;
  if (hasHome !== hasAway) throw new Error("Completá ambos marcadores");
  const played = hasHome && hasAway;
  const homeScore = played ? Number(draft.homeScore) : 0, awayScore = played ? Number(draft.awayScore) : 0;
  if (played && (![homeScore, awayScore].every(Number.isFinite) || homeScore < 0 || awayScore < 0)) throw new Error("Resultado inválido");
  return { date, home, away, homeScore, awayScore, played };
}

export function createRoundRobin(teams, { doubleRound = false, startDate = "", daysBetween = 7, id = (round, match) => `fx-r${round + 1}-m${match + 1}` } = {}) {
  const names = normalizeTeamNames(teams);
  if (names.length < 2) throw new Error("Se necesitan al menos dos equipos");
  const participants = names.length % 2 ? [...names, null] : names.slice();
  const rounds = participants.length - 1, half = participants.length / 2, fixtures = [];
  const baseDate = startDate ? new Date(`${startDate}T12:00:00Z`) : null;
  let rotation = participants.slice();
  for (let round = 0; round < rounds; round += 1) {
    for (let match = 0; match < half; match += 1) {
      let home = rotation[match], away = rotation[rotation.length - 1 - match];
      if (!home || !away) continue;
      if ((round + match) % 2) [home, away] = [away, home];
      const date = baseDate ? new Date(baseDate.getTime() + round * daysBetween * 86400000).toISOString().slice(0, 10) : "";
      fixtures.push({ id: id(round, match), date, home, away, homeScore: 0, awayScore: 0, played: false, round: round + 1 });
    }
    rotation = [rotation[0], rotation.at(-1), ...rotation.slice(1, -1)];
  }
  if (doubleRound) fixtures.push(...fixtures.map((fixture, index) => ({ ...fixture, id: `${fixture.id}-return-${index}`, home: fixture.away, away: fixture.home, round: fixture.round + rounds,
    date: baseDate ? new Date(baseDate.getTime() + (fixture.round - 1 + rounds) * daysBetween * 86400000).toISOString().slice(0, 10) : fixture.date })));
  return fixtures;
}

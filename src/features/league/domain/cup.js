export function cupWinner(match) {
  if (!match || match.scoreA === "" || match.scoreB === "" || match.scoreA == null || match.scoreB == null) return null;
  const a = Number(match.scoreA), b = Number(match.scoreB);
  if (![a, b].every((value) => Number.isFinite(value) && value >= 0)) throw new Error("Resultado de copa inválido");
  if (a > b) return "a";
  if (b > a) return "b";
  if (match.penA !== "" && match.penB !== "" && match.penA != null && match.penB != null) {
    const pa = Number(match.penA), pb = Number(match.penB);
    if (![pa, pb].every((value) => Number.isFinite(value) && value >= 0)) throw new Error("Penales inválidos");
    if (pa > pb) return "a";
    if (pb > pa) return "b";
  }
  return match.winnerPick === "a" || match.winnerPick === "b" ? match.winnerPick : null;
}

export function createCup(teams, { shuffle = false, randomize = (values) => values.slice() } = {}) {
  if (![4, 8, 16, 32].includes(teams?.length)) throw new Error("La copa requiere 4, 8, 16 o 32 equipos");
  const clean = teams.map((team) => String(team || "").trim());
  if (clean.some((team) => !team)) throw new Error("Todos los equipos deben tener nombre");
  if (new Set(clean.map((team) => team.toLocaleLowerCase())).size !== clean.length) throw new Error("No puede haber equipos repetidos");
  return { size: clean.length, teams: shuffle ? randomize(clean) : clean, matches: {} };
}

export function buildCupRounds(cup) {
  if (!cup?.size || !Array.isArray(cup.teams) || cup.teams.length !== cup.size) return [];
  const roundCount = Math.log2(cup.size);
  if (!Number.isInteger(roundCount)) throw new Error("Tamaño de copa inválido");
  const rounds = [];
  let currentTeams = cup.teams.slice();
  for (let round = 0; round < roundCount; round += 1) {
    const matches = [];
    for (let index = 0; index < currentTeams.length / 2; index += 1) {
      const key = `${round}-${index}`, match = cup.matches?.[key] || {};
      matches.push({ key, teamA: currentTeams[index * 2] || null, teamB: currentTeams[index * 2 + 1] || null, match });
    }
    rounds.push(matches);
    currentTeams = matches.map((entry) => {
      const winner = cupWinner(entry.match);
      return winner === "a" ? entry.teamA : winner === "b" ? entry.teamB : null;
    });
  }
  return rounds;
}

export function cupRoundLabel(round, total) {
  const fromEnd = total - round;
  return ({ 1: "Final", 2: "Semifinal", 3: "Cuartos de final", 4: "Octavos de final", 5: "Dieciseisavos de final" })[fromEnd] || `Ronda ${round + 1}`;
}

export function updateCupMatch(cup, key, patch) {
  if (!cup?.matches || typeof key !== "string") throw new Error("Copa inválida");
  const [roundText] = key.split("-");
  const round = Number(roundText);
  if (!Number.isInteger(round) || round < 0) throw new Error("Partido de copa inválido");
  const matches = {};
  for (const [existingKey, value] of Object.entries(cup.matches)) {
    const existingRound = Number(existingKey.split("-")[0]);
    if (existingRound <= round) matches[existingKey] = value;
  }
  matches[key] = { ...(cup.matches[key] || {}), ...patch };
  return { ...cup, matches };
}

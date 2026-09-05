export function dashboardStats({ teams = [], roster = [], matches = [] } = {}) {
  const lastMatch = matches.length ? matches[matches.length - 1] : null;
  return {
    teams: teams.length,
    players: roster.length,
    matches: matches.length,
    lastMatch,
    lastResult: lastMatch ? `${Number(lastMatch.us) || 0}–${Number(lastMatch.them) || 0}` : "—",
  };
}

export function topScorers(matches = [], roster = [], limit = 5) {
  const totals = new Map();
  for (const match of matches) {
    for (const scorer of match?.scorers || []) {
      if (scorer?.playerId == null) continue;
      const goals = Number(scorer.goals);
      if (!Number.isFinite(goals) || goals <= 0) continue;
      totals.set(String(scorer.playerId), (totals.get(String(scorer.playerId)) || 0) + goals);
    }
  }
  return [...totals.entries()]
    .map(([playerId, goals]) => ({
      player: roster.find((player) => String(player.id) === playerId) || null,
      goals,
    }))
    .filter((entry) => entry.player)
    .sort((a, b) => b.goals - a.goals || String(a.player.name).localeCompare(String(b.player.name)))
    .slice(0, Math.max(0, Number(limit) || 0));
}

export function createEditorDraft(team, formations) {
  if (!team) throw new Error("Equipo inválido");
  const available = formations?.[team.mode] || [];
  const formationIndex = Math.max(0, available.findIndex((formation) => formation.name === team.formation));
  return {
    teamId: team.id,
    name: team.name,
    mode: team.mode,
    formIdx: formationIndex,
    freeMode: !!team.freeMode,
    kit: {
      design: team.kit || "solid",
      primary: team.color || "#e11d48",
      secondary: team.secondary || "#0f172a",
    },
    altKit: team.altKit || null,
    activeKit: team.activeKit || "main",
    assignedIds: [...(team.assignedIds || [])],
    freePositions: structuredCopy(team.freePositions || {}),
    captainId: team.captainId ?? null,
    substituteIds: [...(team.substituteIds || [])],
  };
}

export function duplicateTeam(team, { id, now = () => new Date() } = {}) {
  if (!team || !id) throw new Error("Equipo o id inválido");
  return {
    ...team,
    id,
    name: `${String(team.name || "Mi equipo").trim()} (copia)`,
    assignedIds: [...(team.assignedIds || [])],
    freePositions: structuredCopy(team.freePositions || {}),
    substituteIds: [...(team.substituteIds || [])],
    updatedAt: now().toISOString(),
  };
}

export function normalizeMatch(match) {
  const us = Number(match?.us), them = Number(match?.them);
  if (!match?.teamId) throw new Error("Elegí un equipo");
  if (!String(match?.opponent || "").trim()) throw new Error("Indicá el rival");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(match?.date || ""))) throw new Error("Fecha inválida");
  if (![us, them].every((value) => Number.isFinite(value) && value >= 0)) throw new Error("Resultado inválido");
  return {
    ...match,
    teamId: match.teamId,
    opponent: String(match.opponent).trim(),
    date: match.date,
    us,
    them,
    scorers: Array.isArray(match.scorers) ? match.scorers.map((entry) => ({ ...entry })) : [],
  };
}

export function upsertMatch(matches = [], match, idFactory = () => `m${Date.now()}`) {
  const normalized = normalizeMatch(match);
  if (normalized.id) return matches.map((entry) => entry.id === normalized.id ? normalized : entry);
  return [...matches, { ...normalized, id: idFactory() }];
}

function structuredCopy(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

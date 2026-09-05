import { fisherYates } from "./shuffle.js";
function assertTeams(numTeams) { if (!Number.isInteger(numTeams) || numTeams < 2 || numTeams > 16) throw new RangeError("Cantidad de equipos inválida"); }
export function groupAssignments(players, assignments, numTeams) { assertTeams(numTeams); return Array.from({ length: numTeams }, (_, team) => players.filter((player) => assignments[player.id] === team)); }
export function countBalance(players, { assignments = {}, locked = {}, numTeams = 2, random = Math.random } = {}) {
  assertTeams(numTeams);
  const next = { ...assignments }, sizes = Array(numTeams).fill(0);
  for (const player of players) { const team = next[player.id]; if (Number.isInteger(team) && team >= 0 && team < numTeams) sizes[team] += 1; else delete next[player.id]; }
  const unassigned = fisherYates(players.filter((player) => next[player.id] == null), random);
  for (const player of unassigned) { const minimum = Math.min(...sizes), candidates = sizes.map((size, index) => size === minimum ? index : -1).filter((index) => index >= 0); const team = candidates[Math.floor(random() * candidates.length)]; next[player.id] = team; sizes[team] += 1; }
  for (const player of players) if (locked[player.id] && assignments[player.id] != null) next[player.id] = assignments[player.id];
  return next;
}
export function ratingBalance(players, { assignments = {}, locked = {}, numTeams = 2, rating = (player) => Number(player.rating ?? player.attrs?.overall ?? 5), random = Math.random } = {}) {
  assertTeams(numTeams); const next = {}, totals = Array(numTeams).fill(0), sizes = Array(numTeams).fill(0), movable = [];
  for (const player of players) {
    const team = assignments[player.id];
    if (locked[player.id] && Number.isInteger(team) && team >= 0 && team < numTeams) { next[player.id] = team; totals[team] += rating(player); sizes[team] += 1; } else movable.push(player);
  }
  const ordered = fisherYates(movable, random).sort((a, b) => rating(b) - rating(a));
  for (const player of ordered) { const team = totals.map((total, index) => ({ index, total, size: sizes[index] })).sort((a, b) => a.total - b.total || a.size - b.size || a.index - b.index)[0].index; next[player.id] = team; totals[team] += rating(player); sizes[team] += 1; }
  return next;
}
export function createTeamBalancer(strategies = {}) {
  const registry = new Map(Object.entries({ count: countBalance, rating: ratingBalance }));
  for (const [name, strategy] of Object.entries(strategies)) { if (registry.has(name)) throw new Error(`Estrategia ya registrada: ${name}`); if (typeof strategy !== "function") throw new TypeError("La estrategia debe ser una función"); registry.set(name, strategy); }
  return Object.freeze({ strategies: () => [...registry.keys()], balance(name, players, options) { const strategy = registry.get(name); if (!strategy) throw new Error(`Estrategia desconocida: ${name}`); return strategy(players, options); } });
}

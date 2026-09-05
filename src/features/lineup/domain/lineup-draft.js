export function resizeAssignments(ids, size) {
  if (!Number.isInteger(size) || size < 0) throw new Error("Tamaño de formación inválido");
  return Array.from({ length: size }, (_, index) => ids?.[index] ?? null);
}
export function assignPlayer(ids, playerId, slot, size = ids.length) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= size) throw new RangeError("Slot inválido");
  const next = resizeAssignments(ids, size).map((value) => value === playerId ? null : value);
  next[slot] = playerId; return next;
}
export function unassignPlayer(ids, slot, size = ids.length) { const next = resizeAssignments(ids, size); if (slot >= 0 && slot < size) next[slot] = null; return next; }
export function swapSlots(ids, a, b, size = ids.length) { const next = resizeAssignments(ids, size); if (![a, b].every((index) => Number.isInteger(index) && index >= 0 && index < size)) throw new RangeError("Slot inválido"); [next[a], next[b]] = [next[b], next[a]]; return next; }
export function autoFillAssignments(ids, roster, size) {
  const next = resizeAssignments(ids, size), taken = new Set(next.filter((value) => value != null));
  const pool = roster.filter((player) => !taken.has(player.id));
  if (next[0] == null) { const keeperIndex = pool.findIndex((player) => player.pos === "ARQ"); if (keeperIndex >= 0) next[0] = pool.splice(keeperIndex, 1)[0].id; }
  for (let index = 1; index < next.length && pool.length; index += 1) if (next[index] == null) next[index] = pool.shift().id;
  return next;
}
export function toggleId(values, id) { const set = new Set(values || []); set.has(id) ? set.delete(id) : set.add(id); return [...set]; }
export function moveFreePosition(freePositions, key, slot, point, size) {
  const map = { ...(freePositions || {}) }, positions = Array.from({ length: size }, (_, index) => map[key]?.[index] ?? null);
  const x = Number(point?.[0]), y = Number(point?.[1]); if (![x, y].every(Number.isFinite) || x < 0 || x > 100 || y < 0 || y > 100) throw new Error("Posición inválida");
  positions[slot] = [x, y]; map[key] = positions; return map;
}
export function resetFreePositions(freePositions, key) { const map = { ...(freePositions || {}) }; delete map[key]; return map; }
export function chooseModeForPlayerCount(count, formations, modes = [5, 6, 7, 8, 11]) { return modes.find((mode) => formations?.[mode]?.[0]?.positions?.length >= count) || modes.at(-1); }
export function createTeamEntry(draft, formation, now = () => new Date(), idFactory = () => `t${Date.now()}`) {
  const id = draft.teamId || idFactory();
  return { id, name: String(draft.name || "Mi equipo").trim() || "Mi equipo", mode: draft.mode, formation: formation.name, formIdx: draft.formIdx,
    kit: draft.kit.design, color: draft.kit.primary, secondary: draft.kit.secondary, altKit: draft.altKit || null, activeKit: draft.activeKit || "main", lastPlayed: "ahora",
    players: (draft.assignedIds || []).filter((value) => value != null).length, assignedIds: (draft.assignedIds || []).slice(), freePositions: { ...(draft.freePositions || {}) },
    freeMode: Boolean(draft.freeMode), captainId: draft.captainId ?? null, substituteIds: (draft.substituteIds || []).slice(), updatedAt: now().toISOString() };
}

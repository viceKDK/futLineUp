import test from "node:test";
import assert from "node:assert/strict";
import { dashboardStats, topScorers, createEditorDraft, duplicateTeam, normalizeMatch, upsertMatch } from "../../src/features/teams/domain/team-dashboard.js";

test("team dashboard derives stats and scorer ranking without mutating input", () => {
  const roster = [{ id: 1, name: "Ana" }, { id: "2", name: "Bruno" }];
  const matches = [
    { us: 2, them: 1, opponent: "X", scorers: [{ playerId: 1, goals: 1 }, { playerId: 2, goals: 1 }] },
    { us: 3, them: 0, opponent: "Y", scorers: [{ playerId: 1, goals: 2 }] },
  ];
  assert.deepEqual(dashboardStats({ teams: [{ id: 1 }], roster, matches }), {
    teams: 1, players: 2, matches: 2, lastMatch: matches[1], lastResult: "3–0",
  });
  assert.deepEqual(topScorers(matches, roster).map((entry) => [entry.player.name, entry.goals]), [["Ana", 3], ["Bruno", 1]]);
  assert.equal(matches[0].scorers[0].goals, 1);
});

test("team dashboard creates editor drafts and deep-enough duplicates", () => {
  const team = { id: "t1", name: "A", mode: 7, formation: "2-3-1", kit: "solid", color: "#111", assignedIds: [1, 2], freePositions: { "7:0": [[1, 2]] }, substituteIds: [3] };
  const formations = { 7: [{ name: "1-2-2-1" }, { name: "2-3-1" }] };
  const draft = createEditorDraft(team, formations);
  assert.equal(draft.formIdx, 1); assert.deepEqual(draft.assignedIds, [1, 2]);
  draft.assignedIds[0] = 99; assert.equal(team.assignedIds[0], 1);
  const copy = duplicateTeam(team, { id: "t2", now: () => new Date("2026-01-01T00:00:00Z") });
  assert.equal(copy.id, "t2"); assert.equal(copy.name, "A (copia)"); assert.equal(copy.updatedAt, "2026-01-01T00:00:00.000Z");
  copy.freePositions["7:0"][0][0] = 9; assert.equal(team.freePositions["7:0"][0][0], 1);
});

test("match normalization rejects invalid records and upsert preserves ids", () => {
  const valid = normalizeMatch({ teamId: "t1", opponent: " Rival ", date: "2026-01-01", us: "2", them: 1 });
  assert.equal(valid.opponent, "Rival"); assert.equal(valid.us, 2);
  assert.throws(() => normalizeMatch({ teamId: "", opponent: "X", date: "2026-01-01", us: 1, them: 0 }), /equipo/);
  assert.throws(() => normalizeMatch({ teamId: "t", opponent: "", date: "2026-01-01", us: 1, them: 0 }), /rival/);
  assert.throws(() => normalizeMatch({ teamId: "t", opponent: "X", date: "bad", us: 1, them: 0 }), /Fecha/);
  assert.throws(() => normalizeMatch({ teamId: "t", opponent: "X", date: "2026-01-01", us: -1, them: 0 }), /Resultado/);
  const added = upsertMatch([], valid, () => "m1"); assert.equal(added[0].id, "m1");
  const updated = upsertMatch(added, { ...valid, id: "m1", us: 4 }); assert.equal(updated[0].us, 4); assert.equal(updated.length, 1);
});

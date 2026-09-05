import test from "node:test";
import assert from "node:assert/strict";
import { calculateStandings, validatePlayedFixture } from "../../src/features/league/domain/standings.js";
import { createRoundRobin, normalizeTeamNames, inferTeams, validateFixtureDraft } from "../../src/features/league/domain/fixture.js";
import { parseLeagueCsv, detectDelimiter, parseRows } from "../../src/features/league/domain/csv.js";
import { resizeAssignments, assignPlayer, unassignPlayer, swapSlots, autoFillAssignments, toggleId, moveFreePosition, resetFreePositions, chooseModeForPlayerCount, createTeamEntry } from "../../src/features/lineup/domain/lineup-draft.js";
import { inLastDays, attendancePct, lastEvaluation, ratingsTrend, toggleAttendance, createSession, createEvaluation, setPlayerAttribute, addObjective, toggleObjective, deleteObjective, coachOverview } from "../../src/features/coach/domain/coach.js";
import { countBalance, ratingBalance, groupAssignments, createTeamBalancer } from "../../src/features/draw/domain/team-balancer.js";

const seeded = (seed = 1) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

test("league standings validate scores and support points/tie-break strategies", () => {
  const fixtures = [
    { played: true, date: "2026-01-01", home: "A", away: "B", homeScore: 2, awayScore: 0 },
    { played: true, date: "2026-01-02", home: "B", away: "C", homeScore: 1, awayScore: 1 },
    { played: true, date: "2026-01-03", home: "C", away: "A", homeScore: 3, awayScore: 1 },
  ];
  const table = calculateStandings(fixtures);
  assert.deepEqual(table.map((row) => [row.name, row.pts]), [["C", 4], ["A", 3], ["B", 1]]);
  assert.equal(table.reduce((sum, row) => sum + row.gf, 0), table.reduce((sum, row) => sum + row.gc, 0));
  assert.equal(table.reduce((sum, row) => sum + row.pj, 0), 6);
  assert.equal(calculateStandings(fixtures, { points: { win: 2, draw: 1, loss: 0 } })[0].pts, 3);
  const alphabetical = calculateStandings([], { tieBreakers: [(a, b) => a.name.localeCompare(b.name)] });
  assert.deepEqual(alphabetical, []);
  for (const bad of [-1, NaN, Infinity]) assert.throws(() => validatePlayedFixture({ played: true, home: "A", away: "B", homeScore: bad, awayScore: 0 }), /Resultado/);
  assert.throws(() => validatePlayedFixture({ played: true, home: "A", away: "a", homeScore: 1, awayScore: 0 }), /Partido/);
});

test("round robin has exact pair coverage for 2..16 teams", () => {
  for (let count = 2; count <= 16; count += 1) {
    const teams = Array.from({ length: count }, (_, index) => `T${index}`);
    const fixtures = createRoundRobin(teams, { startDate: "2026-01-01" });
    assert.equal(fixtures.length, count * (count - 1) / 2);
    const pairs = new Set();
    for (const fixture of fixtures) {
      assert.notEqual(fixture.home, fixture.away);
      assert.match(fixture.date, /^2026-/);
      const pair = [fixture.home, fixture.away].sort().join("|");
      assert.equal(pairs.has(pair), false);
      pairs.add(pair);
    }
    const double = createRoundRobin(teams, { doubleRound: true });
    assert.equal(double.length, count * (count - 1));
  }
  assert.throws(() => createRoundRobin(["solo"]), /dos equipos/);
  assert.deepEqual(normalizeTeamNames([" A ", "a", { name: "B" }, ""]), ["A", "B"]);
  assert.deepEqual(inferTeams({ teams: ["A"], fixtures: [{ home: "B", away: "C" }] }), ["A", "B", "C"]);
});

test("fixture and CSV parsing are strict, Unicode-safe and delimiter agnostic", () => {
  assert.deepEqual(validateFixtureDraft({ date: "2026-01-01", home: " A ", away: "B", homeScore: "2", awayScore: "1" }), { date: "2026-01-01", home: "A", away: "B", homeScore: 2, awayScore: 1, played: true });
  assert.equal(validateFixtureDraft({ home: "A", away: "B", homeScore: "", awayScore: "" }).played, false);
  assert.throws(() => validateFixtureDraft({ home: "A", away: "A" }), /sí mismo/);
  assert.throws(() => validateFixtureDraft({ home: "A", away: "B", homeScore: "1", awayScore: "" }), /marcadores/);
  assert.throws(() => validateFixtureDraft({ home: "A", away: "B", homeScore: "x", awayScore: "0" }), /Resultado/);
  assert.equal(detectDelimiter("Equipo;Pts\nA;3"), ";");
  assert.deepEqual(parseRows('Equipo,Nota\n"Peñarol, UY","A"'), [["Equipo", "Nota"], ["Peñarol, UY", "A"]]);
  const parsed = parseLeagueCsv("Fecha;Local;Visitante;Goles Local;Goles Visitante\n2026-01-01;Peñarol;Nacional;2;1\n;X;X;;");
  assert.equal(parsed.kind, "fixture"); assert.equal(parsed.fixtures.length, 1); assert.equal(parsed.warnings.length, 1);
  assert.deepEqual(parseLeagueCsv("Equipo\nA\nB\na").teams, ["A", "B"]);
  assert.throws(() => parseLeagueCsv("A,B\n1,2"), /columnas/);
  assert.throws(() => parseLeagueCsv(""), /vacío/);
});

test("lineup domain keeps uniqueness and immutable slot operations", () => {
  const original = [1, 2, null];
  assert.deepEqual(assignPlayer(original, 1, 2), [null, 2, 1]);
  assert.deepEqual(unassignPlayer(original, 1), [1, null, null]);
  assert.deepEqual(swapSlots(original, 0, 1), [2, 1, null]);
  assert.deepEqual(original, [1, 2, null]);
  assert.deepEqual(resizeAssignments([1], 3), [1, null, null]);
  assert.throws(() => resizeAssignments([], -1));
  assert.throws(() => assignPlayer([], 1, 2, 2), /Slot/);
  assert.throws(() => swapSlots([1], 0, 2), /Slot/);
  const roster = [{ id: 1, pos: "DEF" }, { id: 2, pos: "ARQ" }, { id: 3, pos: "MED" }];
  assert.deepEqual(autoFillAssignments([null, null, null], roster, 3), [2, 1, 3]);
  assert.deepEqual(toggleId([1], 1), []); assert.deepEqual(toggleId([], 1), [1]);
  const moved = moveFreePosition({}, "7:0", 1, [20, 30], 3); assert.deepEqual(moved["7:0"][1], [20, 30]);
  assert.deepEqual(resetFreePositions(moved, "7:0"), {});
  assert.throws(() => moveFreePosition({}, "x", 0, [200, 0], 1), /Posición/);
});

test("lineup mode and team snapshots are deterministic through injected clock/id", () => {
  const formations = { 5: [{ positions: Array(5) }], 7: [{ positions: Array(7) }], 11: [{ positions: Array(11) }] };
  assert.equal(chooseModeForPlayerCount(6, formations, [5, 7, 11]), 7);
  assert.equal(chooseModeForPlayerCount(99, formations, [5, 7, 11]), 11);
  const draft = { teamId: null, name: " A ", mode: 5, formIdx: 0, kit: { design: "solid", primary: "#000", secondary: "#fff" }, assignedIds: [1, null, 2], freePositions: {}, substituteIds: [3] };
  const entry = createTeamEntry(draft, { name: "1-2-1" }, () => new Date("2026-01-01T00:00:00Z"), () => "id1");
  assert.equal(entry.id, "id1"); assert.equal(entry.name, "A"); assert.equal(entry.players, 2); assert.equal(entry.updatedAt, "2026-01-01T00:00:00.000Z");
});

test("coach domain handles attendance, evaluations, objectives and overview", () => {
  const sessions = [{ id: "s1", date: "2026-01-01" }, { id: "s2", date: "2026-01-15" }], attendance = { s1: [1], s2: [] };
  assert.equal(attendancePct(1, sessions, attendance), 50); assert.equal(attendancePct(1, [], {}), 0);
  assert.deepEqual(toggleAttendance(attendance, "s2", 1).s2, [1]);
  const evaluations = [{ playerId: 1, date: "2026-01-02", rating: 5 }, { playerId: 1, date: "2026-01-03", rating: 8 }];
  assert.equal(lastEvaluation(1, evaluations).rating, 8); assert.equal(lastEvaluation(2, evaluations), null); assert.deepEqual(ratingsTrend(1, evaluations), [5, 8]);
  assert.equal(inLastDays("2026-01-30", 30, new Date("2026-01-31T12:00:00Z")), true); assert.equal(inLastDays("bad", 30), false);
  assert.deepEqual(createSession({ title: " ", date: "2026-01-01" }, () => "s"), { id: "s", title: "Entrenamiento", date: "2026-01-01" });
  assert.throws(() => createSession({ date: "bad" }, () => "s"));
  assert.equal(createEvaluation({ playerId: 1, form: { rating: "7" }, date: "2026-01-01" }, () => "e").rating, 7);
  assert.throws(() => createEvaluation({ playerId: 1, form: { rating: 11 } }, () => "e"));
  assert.equal(setPlayerAttribute([{ id: 1 }], 1, "pace", 8, { pace: 5 })[0].attrs.pace, 8);
  assert.throws(() => setPlayerAttribute([], 1, "pace", 0));
  let objectives = addObjective([], 1, " Mejorar pase ", () => "o1"); objectives = toggleObjective(objectives, "o1"); assert.equal(objectives[0].done, true); assert.deepEqual(deleteObjective(objectives, "o1"), []); assert.deepEqual(addObjective([], 1, "", () => "x"), []);
  const overview = coachOverview({ roster: [{ id: 1 }], sessions, attendance, evaluations, now: new Date("2026-01-31T12:00:00Z") });
  assert.equal(overview.avgAttendance, 50); assert.equal(overview.avgRating, 6.5); assert.equal(overview.evaluationsLast30, 2);
});

test("team balancers preserve locked players and count strategy differs by at most one", () => {
  for (let total = 2; total <= 60; total += 1) {
    const players = Array.from({ length: total }, (_, id) => ({ id, rating: (id % 10) + 1 }));
    const assignments = countBalance(players, { numTeams: 4, random: seeded(total) });
    assert.equal(Object.keys(assignments).length, total);
    const sizes = groupAssignments(players, assignments, 4).map((team) => team.length);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
  }
  const players = [{ id: 1, rating: 10 }, { id: 2, rating: 9 }, { id: 3, rating: 2 }, { id: 4, rating: 1 }];
  const rated = ratingBalance(players, { numTeams: 2, assignments: { 1: 1 }, locked: { 1: true }, random: seeded(3) });
  assert.equal(rated[1], 1);
  const totals = groupAssignments(players, rated, 2).map((team) => team.reduce((sum, player) => sum + player.rating, 0));
  assert.ok(Math.abs(totals[0] - totals[1]) <= 10);
  const balancer = createTeamBalancer({ reverse: (list) => Object.fromEntries(list.map((player, index) => [player.id, index % 2])) });
  assert.ok(balancer.strategies().includes("reverse")); assert.equal(balancer.balance("reverse", players)[1], 0);
  assert.throws(() => createTeamBalancer({ count: () => ({}) }), /registrada/); assert.throws(() => createTeamBalancer({ bad: 1 }), /función/); assert.throws(() => balancer.balance("missing", players));
});

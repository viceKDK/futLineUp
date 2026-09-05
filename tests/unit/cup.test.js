import test from "node:test";
import assert from "node:assert/strict";
import { cupWinner, createCup, buildCupRounds, cupRoundLabel, updateCupMatch } from "../../src/features/league/domain/cup.js";

test("cup winner handles regular time, penalties and explicit fallback", () => {
  assert.equal(cupWinner({ scoreA: 2, scoreB: 1 }), "a");
  assert.equal(cupWinner({ scoreA: 1, scoreB: 2 }), "b");
  assert.equal(cupWinner({ scoreA: 1, scoreB: 1, penA: 4, penB: 3 }), "a");
  assert.equal(cupWinner({ scoreA: 1, scoreB: 1, winnerPick: "b" }), "b");
  assert.equal(cupWinner({ scoreA: "", scoreB: "" }), null);
  assert.equal(cupWinner({ scoreA: 1, scoreB: 1, penA: 3, penB: 3 }), null);
  assert.throws(() => cupWinner({ scoreA: -1, scoreB: 0 }), /inválido/);
  assert.throws(() => cupWinner({ scoreA: 1, scoreB: 1, penA: "x", penB: 2 }), /Penales/);
});

test("cup creation validates powers used by product and supports deterministic shuffling", () => {
  const teams = ["A", "B", "C", "D"];
  assert.deepEqual(createCup(teams).teams, teams);
  assert.deepEqual(createCup(teams, { shuffle: true, randomize: (values) => values.slice().reverse() }).teams, ["D", "C", "B", "A"]);
  assert.throws(() => createCup(["A", "B"]), /requiere/);
  assert.throws(() => createCup(["A", "B", "C", ""]), /nombre/);
  assert.throws(() => createCup(["A", "a", "C", "D"]), /repetidos/);
});

test("bracket propagation is deterministic and does not mutate cup", () => {
  const base = createCup(["A", "B", "C", "D"]);
  const semiA = updateCupMatch(base, "0-0", { scoreA: 1, scoreB: 0 });
  const semiB = updateCupMatch(semiA, "0-1", { scoreA: 0, scoreB: 2 });
  let rounds = buildCupRounds(semiB);
  assert.equal(rounds.length, 2);
  assert.deepEqual([rounds[1][0].teamA, rounds[1][0].teamB], ["A", "D"]);
  const final = updateCupMatch(semiB, "1-0", { scoreA: 2, scoreB: 1 });
  rounds = buildCupRounds(final);
  assert.equal(cupWinner(rounds[1][0].match), "a");
  assert.deepEqual(base.matches, {});
  assert.equal(cupRoundLabel(0, 2), "Semifinal");
  assert.equal(cupRoundLabel(1, 2), "Final");
  assert.equal(cupRoundLabel(0, 6), "Ronda 1");
  assert.deepEqual(buildCupRounds(null), []);
});

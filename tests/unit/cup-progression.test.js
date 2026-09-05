import test from "node:test";
import assert from "node:assert/strict";
import { createCup, updateCupMatch, buildCupRounds } from "../../src/features/league/domain/cup.js";

test("changing an early cup result invalidates later-round scores", () => {
  let cup = createCup(["A", "B", "C", "D"]);
  cup = updateCupMatch(cup, "0-0", { scoreA: 1, scoreB: 0 });
  cup = updateCupMatch(cup, "0-1", { scoreA: 1, scoreB: 0 });
  cup = updateCupMatch(cup, "1-0", { scoreA: 2, scoreB: 0 });
  assert.ok(cup.matches["1-0"]);
  cup = updateCupMatch(cup, "0-0", { scoreA: 0, scoreB: 1 });
  assert.equal(cup.matches["1-0"], undefined);
  const final = buildCupRounds(cup)[1][0];
  assert.equal(final.teamA, "B");
  assert.equal(final.teamB, "C");
});

test("cup updates reject malformed match keys", () => {
  const cup = createCup(["A", "B", "C", "D"]);
  assert.throws(() => updateCupMatch(cup, "bad", { scoreA: 1 }), /Partido/);
});

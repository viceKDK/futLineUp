import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("league setup delegates CSV and team inference to league domain", async () => {
  const source = await readFile("src/features/league/presentation/page-league-setup.jsx", "utf8");
  assert.match(source, /window\.fcLeague\.parseLeagueCsv/);
  assert.match(source, /window\.fcLeague\.inferTeams/);
  assert.match(source, /window\.fcLeague\.normalizeTeamNames/);
  assert.doesNotMatch(source, /function\s+(?:detectLeagueCsvDelimiter|parseLeagueCsvRows|normalizeLeagueCsvHeader|leagueCsvIndex)\b/);
});

test("draw page delegates balancing and lineup mode policy", async () => {
  const source = await readFile("src/features/draw/presentation/page-draw.jsx", "utf8");
  assert.match(source, /fcDrawDomain\.createTeamBalancer/);
  assert.match(source, /fcLineup\.chooseModeForPlayerCount/);
  assert.doesNotMatch(source, /function\s+(?:countBalance|ratingBalance|fisherYates)\b/);
});

test("coach page delegates business rules to coach domain", async () => {
  const source = await readFile("src/features/coach/presentation/page-coach.jsx", "utf8");
  assert.match(source, /window\.fcCoachDomain/);
  for (const name of ["attendancePct", "createSession", "createEvaluation", "setPlayerAttribute", "addObjective", "coachOverview"]) {
    assert.match(source, new RegExp(`D\\.${name}`));
  }
  assert.doesNotMatch(source, /function\s+inLastDays\b/);
});

test("editor delegates assignment/free-position/team snapshot rules to lineup domain", async () => {
  const source = await readFile("src/features/lineup/presentation/page-editor.jsx", "utf8");
  assert.match(source, /window\.fcLineup/);
  for (const name of ["resizeAssignments", "assignPlayer", "swapSlots", "autoFillAssignments", "moveFreePosition", "createTeamEntry"]) {
    assert.match(source, new RegExp(`L\\.${name}`));
  }
  assert.doesNotMatch(source, /const\s+autoFill\s*=\s*\(\)\s*=>\s*\{\s*setIds\(\(ids\)\s*=>\s*\{/s);
});

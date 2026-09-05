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

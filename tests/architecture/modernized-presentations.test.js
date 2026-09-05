import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) { return readFile(path, "utf8"); }

test("league setup delegates CSV and team inference to league domain", async () => {
  const code = await source("src/features/league/presentation/page-league-setup.jsx");
  assert.match(code, /window\.fcLeague\.parseLeagueCsv/);
  assert.match(code, /window\.fcLeague\.inferTeams/);
  assert.match(code, /window\.fcLeague\.normalizeTeamNames/);
  assert.doesNotMatch(code, /function\s+(?:detectLeagueCsvDelimiter|parseLeagueCsvRows|normalizeLeagueCsvHeader|leagueCsvIndex)\b/);
});

test("league page delegates standings, fixture and cup rules", async () => {
  const code = await source("src/features/league/presentation/page-league.jsx");
  for (const name of ["calculateStandings", "validateFixtureDraft", "createRoundRobin", "createCup", "buildCupRounds", "updateCupMatch", "cupRoundLabel"]) assert.match(code, new RegExp(`L\\.${name}`));
  assert.doesNotMatch(code, /function\s+(?:calculateStandings|getCupWinner|buildCupRounds|cupRoundLabel)\b/);
});

test("draw page delegates balancing and lineup mode policy", async () => {
  const code = await source("src/features/draw/presentation/page-draw.jsx");
  assert.match(code, /fcDrawDomain\.createTeamBalancer/);
  assert.match(code, /fcLineup\.chooseModeForPlayerCount/);
  assert.doesNotMatch(code, /function\s+(?:countBalance|ratingBalance|fisherYates)\b/);
});

test("coach page delegates business rules to coach domain", async () => {
  const code = await source("src/features/coach/presentation/page-coach.jsx");
  assert.match(code, /window\.fcCoachDomain/);
  for (const name of ["attendancePct", "createSession", "createEvaluation", "setPlayerAttribute", "addObjective", "coachOverview"]) assert.match(code, new RegExp(`D\\.${name}`));
  assert.doesNotMatch(code, /function\s+inLastDays\b/);
});

test("editor delegates assignment/free-position/team snapshot rules to lineup domain", async () => {
  const code = await source("src/features/lineup/presentation/page-editor.jsx");
  assert.match(code, /window\.fcLineup/);
  for (const name of ["resizeAssignments", "assignPlayer", "swapSlots", "autoFillAssignments", "moveFreePosition", "createTeamEntry"]) assert.match(code, new RegExp(`L\\.${name}`));
});

test("home delegates dashboard, duplicate, editor-draft and match rules to teams domain", async () => {
  const code = await source("src/features/teams/presentation/page-home.jsx");
  assert.match(code, /window\.fcTeamsDomain/);
  for (const name of ["dashboardStats", "topScorers", "createEditorDraft", "duplicateTeam", "upsertMatch"]) assert.match(code, new RegExp(`T\\.${name}`));
  assert.doesNotMatch(code, /function\s+(?:topScorers|duplicateTeam|createEditorDraft)\b/);
});

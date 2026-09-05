import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function loadMutant(path, search, replacement) {
  const source = await readFile(resolve(path), "utf8");
  if (!source.includes(search)) throw new Error(`Mutación obsoleta: no se encontró ${search} en ${path}`);
  const mutated = source.replace(search, replacement);
  return import(`data:text/javascript;base64,${Buffer.from(mutated).toString("base64")}#${Math.random()}`);
}
const mutants = [
  {
    name: "standings reverses points priority",
    module: "src/features/league/domain/standings.js",
    search: "b.pts - a.pts",
    replace: "a.pts - b.pts",
    killed(api) { return api.calculateStandings([{ played: true, home: "A", away: "B", homeScore: 1, awayScore: 0 }])[0].name !== "A"; },
  },
  {
    name: "coach excludes same-day observations",
    module: "src/features/coach/domain/coach.js",
    search: "diff >= 0 && diff < days",
    replace: "diff > 0 && diff < days",
    killed(api) { return api.inLastDays("2026-01-01T12:00:00Z", 1, new Date("2026-01-01T12:00:00Z")) !== true; },
  },
  {
    name: "lineup allows duplicate assignment",
    module: "src/features/lineup/domain/lineup-draft.js",
    search: ".map((value) => value === playerId ? null : value)",
    replace: ".map((value) => value)",
    killed(api) { const ids = api.assignPlayer([1, null], 1, 1); return new Set(ids.filter((id) => id != null)).size !== ids.filter((id) => id != null).length; },
  },
];
let survived = 0;
for (const mutant of mutants) {
  const api = await loadMutant(mutant.module, mutant.search, mutant.replace);
  const killed = Boolean(mutant.killed(api));
  console.log(`${killed ? "KILLED" : "SURVIVED"} ${mutant.name}`);
  if (!killed) survived += 1;
}
if (survived) {
  console.error(`${survived}/${mutants.length} mutantes sobrevivieron`);
  process.exitCode = 1;
} else {
  console.log(`${mutants.length}/${mutants.length} mutantes de riesgo fueron detectados por los invariantes.`);
}

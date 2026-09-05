import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { listFiles } from "./source-files.mjs";

export const LEGACY_PRESENTATION_CEILINGS = Object.freeze({
  "src/features/league/presentation/page-league.jsx": 1200,
  "src/features/coach/presentation/page-coach.jsx": 1000,
  "src/features/lineup/presentation/page-editor.jsx": 900,
  "src/features/sharing/presentation/page-share.jsx": 900,
  "src/features/teams/presentation/page-home.jsx": 800,
  "src/features/league/presentation/page-league-setup.jsx": 800,
  "src/features/league/presentation/league-participant-guard.jsx": 800,
  "src/promo-scenes.jsx": 1800,
});

export function measureSource(file, source) {
  const lines = source.split(/\r?\n/).length;
  const decisions = (source.match(/\b(?:if|for|while|case|catch)\b|&&|\|\||\?/g) || []).length;
  const functions = (source.match(/\bfunction\b|=>/g) || []).length;
  return { file, lines, decisions, functions, decisionDensity: Number((decisions / Math.max(lines, 1)).toFixed(3)) };
}

export async function collectSourceQuality(root = process.cwd()) {
  const base = resolve(root);
  const files = (await listFiles(resolve(root, "src"))).filter((file) => /\.(?:js|jsx)$/.test(file));
  return Promise.all(files.map(async (absolute) => {
    const file = absolute.slice(base.length + 1).replaceAll("\\", "/");
    return measureSource(file, await readFile(absolute, "utf8"));
  }));
}

export function budgetFor(file, { targetLines = 500, coreLines = 300 } = {}) {
  if (/\/(?:domain|application|infrastructure)\//.test(file)) return coreLines;
  return LEGACY_PRESENTATION_CEILINGS[file] || targetLines;
}

export function budgetViolations(metrics, options = {}) {
  return metrics.flatMap((metric) => {
    const max = budgetFor(metric.file, options);
    return metric.lines > max ? [{ ...metric, max }] : [];
  });
}

export function migrationDebt(metrics, targetLines = 500) {
  return metrics.filter((metric) => metric.lines > targetLines).map((metric) => ({ ...metric, target: targetLines }));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  const metrics = await collectSourceQuality();
  const violations = budgetViolations(metrics);
  const debt = migrationDebt(metrics);
  await mkdir(".dist/quality", { recursive: true });
  await writeFile(".dist/quality/source-metrics.json", JSON.stringify({ targetLines: 500, metrics, debt, violations }, null, 2));
  console.table(metrics.sort((a, b) => b.lines - a.lines).slice(0, 20));
  if (debt.length) console.warn(`${debt.length} archivos legacy siguen sobre el objetivo de 500 líneas.`);
  if (violations.length) {
    console.error("Source budgets exceeded", violations);
    if (process.argv.includes("--check")) process.exitCode = 1;
  }
}

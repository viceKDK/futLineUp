import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { listFiles } from "./source-files.mjs";

export function measureSource(file, source) {
  const lines = source.split(/\r?\n/).length;
  const decisions = (source.match(/\b(?:if|for|while|case|catch)\b|&&|\|\||\?/g) || []).length;
  const functions = (source.match(/\bfunction\b|=>/g) || []).length;
  return { file, lines, decisions, functions, decisionDensity: Number((decisions / Math.max(lines, 1)).toFixed(3)) };
}
export async function collectSourceQuality(root = process.cwd()) {
  const base = resolve(root), files = (await listFiles(resolve(root, "src"))).filter((file) => /\.(?:js|jsx)$/.test(file));
  return Promise.all(files.map(async (absolute) => { const file = absolute.slice(base.length + 1).replaceAll("\\", "/"); return measureSource(file, await readFile(absolute, "utf8")); }));
}
export function budgetViolations(metrics, { targetLines = 500, coreLines = 300, hardLines = 1000 } = {}) {
  return metrics.flatMap((metric) => {
    const core = /\/(?:domain|application|infrastructure)\//.test(metric.file), max = core ? coreLines : hardLines;
    return metric.lines > max ? [{ ...metric, max, targetLines }] : [];
  });
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  const metrics = await collectSourceQuality(), violations = budgetViolations(metrics);
  await mkdir(".dist/quality", { recursive: true });
  await writeFile(".dist/quality/source-metrics.json", JSON.stringify({ targetLines: 500, metrics, violations }, null, 2));
  console.table(metrics.sort((a, b) => b.lines - a.lines).slice(0, 20));
  if (violations.length) console.error("Hard source budgets exceeded", violations);
  if (process.argv.includes("--check") && violations.length) process.exitCode = 1;
}

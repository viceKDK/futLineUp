import { SourceTextModule } from "node:vm";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, posix } from "node:path";
import { nativeModules } from "./source-files.mjs";

export function packageOf(file) {
  const parts = file.split("/");
  if (parts[1] === "features") return `features/${parts[2]}`;
  if (parts[1] === "shared") return `shared/${parts[2]}`;
  if (parts[1] === "app") return "app";
  return "legacy";
}
function abstractionMarker(file, source) {
  return /(?:^|\/)(?:ports?|contracts?)(?:\/|[-.])/.test(file) || /@typedef\b|@interface\b/.test(source);
}
export function analyzePackageMetrics(sources) {
  const packages = new Map(), dependencies = new Map();
  const ensure = (name) => { if (!packages.has(name)) packages.set(name, { name, modules: 0, abstractModules: 0, ca: new Set(), ce: new Set() }); return packages.get(name); };
  for (const [file, source] of sources) {
    const sourcePackage = packageOf(file), current = ensure(sourcePackage); current.modules += 1; if (abstractionMarker(file, source)) current.abstractModules += 1;
    const parsed = new SourceTextModule(source, { identifier: file });
    for (const specifier of parsed.dependencySpecifiers) {
      if (!specifier.startsWith(".")) continue;
      const target = posix.normalize(posix.join(posix.dirname(file), specifier));
      if (!sources.has(target)) continue;
      const targetPackage = packageOf(target); if (targetPackage === sourcePackage) continue;
      ensure(targetPackage); current.ce.add(targetPackage); packages.get(targetPackage).ca.add(sourcePackage);
      if (!dependencies.has(sourcePackage)) dependencies.set(sourcePackage, new Set()); dependencies.get(sourcePackage).add(targetPackage);
    }
  }
  const rows = [...packages.values()].map((pkg) => {
    const ca = pkg.ca.size, ce = pkg.ce.size, instability = ca + ce ? ce / (ca + ce) : 0;
    const abstractness = pkg.modules ? pkg.abstractModules / pkg.modules : 0, distance = Math.abs(abstractness + instability - 1);
    return { package: pkg.name, modules: pkg.modules, abstractModules: pkg.abstractModules, ca, ce, I: Number(instability.toFixed(3)), A: Number(abstractness.toFixed(3)), D: Number(distance.toFixed(3)) };
  }).sort((a, b) => a.package.localeCompare(b.package));
  const byName = new Map(rows.map((row) => [row.package, row]));
  const sdpViolations = [];
  for (const [from, targets] of dependencies) for (const to of targets) {
    const source = byName.get(from), target = byName.get(to);
    if (source && target && source.I + 0.15 < target.I) sdpViolations.push({ from, to, sourceI: source.I, targetI: target.I });
  }
  return { packages: rows, sdpViolations };
}
export async function collectPackageMetrics(root = process.cwd()) {
  const files = await nativeModules(root), sources = new Map();
  for (const file of files) sources.set(file, await readFile(resolve(root, file), "utf8"));
  return analyzePackageMetrics(sources);
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  const report = await collectPackageMetrics(); await mkdir(".dist/quality", { recursive: true }); await writeFile(".dist/quality/package-metrics.json", JSON.stringify(report, null, 2)); console.table(report.packages); if (report.sdpViolations.length) console.warn("SDP candidates", report.sdpViolations);
}

import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listFiles, nativeModules, isCoreModule } from "./source-files.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coverage = process.argv.includes("--coverage");
const [major, minor] = process.versions.node.split(".").map(Number);
if (coverage && (major < 22 || (major === 22 && minor < 8))) {
  console.error("Coverage requiere Node >=22.8. Usá la versión de .nvmrc.");
  process.exit(1);
}
const suites = await Promise.all(
  ["unit", "contracts"].map((folder) => listFiles(resolve(root, "tests", folder))),
);
const files = suites.flat().filter((file) => file.endsWith(".test.js"));
if (!files.length) throw new Error("No se encontraron pruebas unitarias");
const args = [
  "--test", "--test-concurrency=1",
  "--test-reporter=spec", "--test-reporter-destination=stdout",
];
if (coverage) {
  await mkdir(resolve(root, "coverage"), { recursive: true });
  const measured = (await nativeModules(root)).filter(isCoreModule);
  if (!measured.length) throw new Error("El inventario de cobertura está vacío");
  args.push(
    "--experimental-test-coverage",
    "--test-coverage-lines=95",
    "--test-coverage-branches=90",
    "--test-coverage-functions=95",
    ...measured.map((file) => `--test-coverage-include=${file}`),
    "--test-reporter=lcov", "--test-reporter-destination=coverage/lcov.info",
    "--test-reporter=./scripts/coverage-reporter.mjs",
    "--test-reporter-destination=coverage/summary.json",
  );
}
const result = spawnSync(process.execPath, [...args, ...files], {
  cwd: root, stdio: "inherit",
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);

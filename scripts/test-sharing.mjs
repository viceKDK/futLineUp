import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listFiles, nativeModules } from "./source-files.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coverage = process.argv.includes("--coverage");
const tests = (await listFiles(resolve(root, "tests/unit"))).filter((file) =>
  /[/\\]sharing-[^/\\]+\.test\.js$/.test(file),
);
if (!tests.length) throw new Error("No hay pruebas de Compartir");
const args = [
  "--test",
  "--test-reporter=spec",
  "--test-reporter-destination=stdout",
];
if (coverage) {
  const measured = (await nativeModules(root)).filter(
    (file) =>
      /^src\/features\/sharing\/(domain|application|infrastructure)\//.test(
        file,
      ) || file === "src/shared/domain/civil-date.js",
  );
  await mkdir(resolve(root, "coverage/sharing"), { recursive: true });
  args.push(
    "--experimental-test-coverage",
    "--test-coverage-lines=95",
    "--test-coverage-branches=90",
    "--test-coverage-functions=95",
    ...measured.map((file) => `--test-coverage-include=${file}`),
    "--test-reporter=lcov",
    "--test-reporter-destination=coverage/sharing/lcov.info",
    "--test-reporter=./scripts/coverage-reporter.mjs",
    "--test-reporter-destination=coverage/sharing/summary.json",
  );
}
const result = spawnSync(process.execPath, [...args, ...tests], {
  cwd: root,
  stdio: "inherit",
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;

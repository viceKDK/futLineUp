import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { collectReleaseFiles } from "./release-files.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = promisify(execFile);
const packageJson = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
const expectedTag = `v${packageJson.version}`;
if (
  process.env.GITHUB_REF_TYPE === "tag" &&
  process.env.GITHUB_REF_NAME !== expectedTag
) {
  throw new Error(
    `El tag ${process.env.GITHUB_REF_NAME} no coincide con package.json (${expectedTag})`,
  );
}
let commit = process.env.GITHUB_SHA || "local";
try {
  if (commit === "local")
    commit = (
      await run("git", ["rev-parse", "HEAD"], { cwd: root })
    ).stdout.trim();
} catch (_) {}

const files = [];
for (const path of await collectReleaseFiles(root)) {
  const absolute = resolve(root, path);
  const content = await readFile(absolute);
  files.push({
    path,
    bytes: (await stat(absolute)).size,
    sha256: createHash("sha256").update(content).digest("hex"),
  });
}

const manifest = {
  schemaVersion: 1,
  release: expectedTag,
  commit,
  createdAt: new Date().toISOString(),
  files,
};
const output = resolve(
  root,
  ".dist",
  "releases",
  manifest.release,
  "manifest.json",
);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(
  `${manifest.release}: ${files.length} archivos registrados en ${output}`,
);

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
const path = resolve(
  root,
  process.argv[2] || `.dist/releases/v${packageJson.version}/manifest.json`,
);
const manifest = JSON.parse(await readFile(path, "utf8"));
const failures = [];

for (const file of manifest.files) {
  try {
    const content = await readFile(resolve(root, file.path));
    const sha256 = createHash("sha256").update(content).digest("hex");
    if (sha256 !== file.sha256) failures.push(`${file.path}: hash diferente`);
  } catch (error) {
    failures.push(`${file.path}: ${error.code || error.message}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  `${manifest.release}: ${manifest.files.length} archivos verificados.`,
);

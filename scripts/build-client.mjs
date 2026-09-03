import Babel from "@babel/standalone";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = promisify(execFile);
const packageJson = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
let commit = process.env.GITHUB_SHA || "local";
try {
  if (commit === "local")
    commit = (
      await run("git", ["rev-parse", "--short=12", "HEAD"], { cwd: root })
    ).stdout.trim();
} catch (_) {}
await mkdir(resolve(root, "compiled"), { recursive: true });
await writeFile(
  resolve(root, "compiled", "release.js"),
  `window.FC_RELEASE=${JSON.stringify({
    version: packageJson.version,
    commit,
    builtAt: new Date().toISOString(),
  })};\n`,
  "utf8",
);
const entries = [
  "icons",
  "data",
  "supabase",
  "kits",
  "pitch",
  "sidebar",
  "page-auth",
  "page-home",
  "page-mode",
  "page-editor",
  "page-draw",
  "page-kits",
  "page-crests",
  "page-rival",
  "page-share",
  "platform-charts",
  "page-settings",
  "page-coach",
  "page-league",
  "league-table-upgrade",
  "page-league-setup",
  "league-participant-guard",
  "platform-mount",
];

for (const entry of entries) {
  const source = await readFile(resolve(root, "src", `${entry}.jsx`), "utf8");
  const result = Babel.transform(source, {
    filename: `${entry}.jsx`,
    presets: [["react", { runtime: "classic" }]],
    sourceType: "script",
    comments: false,
    compact: false,
  });
  await writeFile(
    resolve(root, "compiled", `${entry}.js`),
    `${result.code}\n//# sourceURL=src/${entry}.jsx\n`,
    "utf8",
  );
}
console.log(
  `Compiladas ${entries.length} entradas y release ${packageJson.version} en compiled/.`,
);

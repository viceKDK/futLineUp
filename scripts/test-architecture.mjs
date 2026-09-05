import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listFiles } from "./source-files.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = (await listFiles(resolve(root, "tests/architecture")))
  .filter((file) => file.endsWith(".test.js"));
if (!files.length) throw new Error("No se encontraron pruebas de arquitectura");
const result = spawnSync(process.execPath,
  ["--experimental-vm-modules", "--test", ...files],
  { cwd: root, stdio: "inherit" });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);

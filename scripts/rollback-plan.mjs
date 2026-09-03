import { execFile } from "node:child_process";
import { promisify } from "node:util";

const tag = process.argv[2];
if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag || "")) {
  console.error("Uso: npm run rollback:plan -- v1.2.3");
  process.exit(2);
}

try {
  await promisify(execFile)("git", [
    "rev-parse",
    "--verify",
    `refs/tags/${tag}`,
  ]);
} catch (_) {
  console.error(
    `No existe el tag local ${tag}. Ejecutá git fetch --tags y reintentá.`,
  );
  process.exit(1);
}

console.log(`Plan seguro y no destructivo para ${tag}:`);
console.log(`1. git switch -c codex/rollback-${tag.slice(1)} ${tag}`);
console.log("2. npm ci");
console.log("3. npm run quality");
console.log("4. npm run release:manifest && npm run release:verify");
console.log(
  "5. Publicar con el procedimiento existente (este comando no despliega nada).",
);
console.log(
  "6. No revertir migraciones de datos: aplicar una migración correctiva hacia adelante.",
);

import { readdir, stat } from "node:fs/promises";
import { resolve, relative } from "node:path";

export const releaseRoots = [
  "futbolClub.html",
  "manifest.webmanifest",
  "service-worker.js",
  "compiled",
  "src/auto-backup.js",
  "src/bootstrap.js",
  "src/local-config.example.js",
  "src/observability.js",
  "styles",
  "vendor",
  "icons",
];

export async function collectReleaseFiles(root) {
  const files = [];
  async function visit(path) {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = resolve(path, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile())
        files.push(relative(root, child).replaceAll("\\", "/"));
    }
  }
  for (const item of releaseRoots) {
    const absolute = resolve(root, item);
    if ((await stat(absolute)).isDirectory()) await visit(absolute);
    else files.push(item);
  }
  return [...new Set(files)].sort();
}

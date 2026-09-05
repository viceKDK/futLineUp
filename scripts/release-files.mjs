import { readdir, stat } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { nativeModules } from "./source-files.mjs";

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
  // Native imports are runtime assets. Do not include all of src blindly:
  // local-config.js and other root-level private configuration stay excluded.
  return [...new Set([...files, ...(await nativeModules(root))])].sort();
}

import { readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
export async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? listFiles(join(directory, entry.name)) : [join(directory, entry.name)]));
  return nested.flat().sort();
}
export async function nativeModules(root) {
  return (await listFiles(join(root, "src")))
    .map((file) => relative(root, file).split(sep).join("/"))
    .filter((file) => file.endsWith(".js") && file.split("/").length > 2);
}
export const isCoreModule = (file) => /\/(domain|application|infrastructure)\//.test(file)
  || ["src/app/create-runtime.js", "src/app/install-browser-runtime.js"].includes(file);

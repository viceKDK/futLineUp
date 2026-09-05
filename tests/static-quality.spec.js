import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";
import { clientEntries } from "../scripts/client-entries.mjs";

const root = process.cwd();
test("HTML no permite scripts inline ni manejadores de eventos inline", async () => {
  const html = await readFile(resolve(root, "futbolClub.html"), "utf8");
  expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/i);
  expect(html).not.toMatch(/\son[a-z]+\s*=/i);
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/i);
  expect(csp).not.toBeNull();
  expect(csp[1]).toMatch(/script-src 'self';/);
  expect(csp[1]).not.toMatch(/script-src[^;]*'unsafe-inline'/);
});
test("estilos estáticos y entradas resueltas por el manifiesto canónico", async () => {
  const modules = ["platform-charts", "page-settings", "page-coach", "page-league", "platform-mount"];
  const sourceFiles = await Promise.all(modules.map((name) =>
    readFile(resolve(root, clientEntries[name]), "utf8")));
  expect(sourceFiles.join("\n")).not.toContain('document.createElement("style")');
  await expect(access(resolve(root, "src/page-platform.jsx"))).rejects.toThrow();
  for (const file of ["app.css", "pages.css"]) {
    await expect(access(resolve(root, "styles", file))).resolves.toBeUndefined();
  }
});
test("consumidores clásicos esperan al módulo de datos", async () => {
  const html = await readFile(resolve(root, "futbolClub.html"), "utf8");
  const scripts = [...html.matchAll(/<script\b([^>]*)>/g)].map((match) => match[1]);
  const index = scripts.findIndex((attrs) => attrs.includes('src="compiled/data.js"'));
  expect(index).toBeGreaterThan(-1);
  expect(scripts[index]).toContain('type="module"');
  for (const attrs of scripts.slice(index + 1)) expect(attrs).toMatch(/\bdefer\b/);
});

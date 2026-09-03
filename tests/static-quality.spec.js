import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

const root = process.cwd();

test("HTML no permite scripts inline ni manejadores de eventos inline", async () => {
  const html = await readFile(resolve(root, "futbolClub.html"), "utf8");
  expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/i);
  expect(html).not.toMatch(/\son[a-z]+\s*=/i);
  const csp = html.match(
    /http-equiv="Content-Security-Policy" content="([^"]+)"/i,
  );
  expect(csp).not.toBeNull();
  expect(csp[1]).toMatch(/script-src 'self';/);
  expect(csp[1]).not.toMatch(/script-src[^;]*'unsafe-inline'/);
});

test("los estilos de páginas son estáticos y plataforma sigue modularizada", async () => {
  const modules = [
    "platform-charts.jsx",
    "page-settings.jsx",
    "page-coach.jsx",
    "page-league.jsx",
    "platform-mount.jsx",
  ];
  for (const file of modules) {
    await expect(access(resolve(root, "src", file))).resolves.toBeUndefined();
  }
  await expect(
    access(resolve(root, "src", "page-platform.jsx")),
  ).rejects.toThrow();

  const sourceFiles = await Promise.all(
    modules.map((file) => readFile(resolve(root, "src", file), "utf8")),
  );
  expect(sourceFiles.join("\n")).not.toContain(
    'document.createElement("style")',
  );
  await expect(
    access(resolve(root, "styles", "app.css")),
  ).resolves.toBeUndefined();
  await expect(
    access(resolve(root, "styles", "pages.css")),
  ).resolves.toBeUndefined();
});

import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = {
  "node_modules/react/umd/react.production.min.js":
    "vendor/react.production.min.js",
  "node_modules/react-dom/umd/react-dom.production.min.js":
    "vendor/react-dom.production.min.js",
  "node_modules/html2canvas/dist/html2canvas.min.js":
    "vendor/html2canvas.min.js",
  "node_modules/jspdf/dist/jspdf.umd.min.js": "vendor/jspdf.umd.min.js",
  "node_modules/@supabase/supabase-js/dist/umd/supabase.js":
    "vendor/supabase.js",
  "node_modules/web-vitals/dist/web-vitals.attribution.iife.js":
    "vendor/web-vitals.attribution.iife.js",
};

await mkdir(resolve(root, "vendor"), { recursive: true });
for (const [source, target] of Object.entries(files)) {
  await copyFile(resolve(root, source), resolve(root, target));
}
console.log(`Sincronizados ${Object.keys(files).length} archivos en vendor/.`);

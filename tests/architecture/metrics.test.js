import test from "node:test";
import assert from "node:assert/strict";
import { analyzePackageMetrics, packageOf } from "../../scripts/package-metrics.mjs";
import { measureSource, budgetViolations } from "../../scripts/source-quality.mjs";

test("package metrics compute Ca/Ce/I/A/D and identify unstable dependencies", () => {
  const sources = new Map([
    ["src/features/a/domain/a.js", 'export const a = 1;'],
    ["src/features/b/application/b.js", 'import "../../a/domain/a.js"; export const b = 2;'],
    ["src/app/main.js", 'import "../features/b/application/b.js";'],
  ]);
  const report = analyzePackageMetrics(sources), a = report.packages.find((row) => row.package === "features/a"), b = report.packages.find((row) => row.package === "features/b");
  assert.equal(a.ca, 1); assert.equal(a.ce, 0); assert.equal(a.I, 0); assert.equal(b.ca, 1); assert.equal(b.ce, 1); assert.equal(b.I, 0.5); assert.equal(typeof a.D, "number"); assert.deepEqual(report.sdpViolations, []);
  assert.equal(packageOf("src/shared/domain/a.js"), "shared/domain"); assert.equal(packageOf("src/app/a.js"), "app");
});

test("package metrics recognize explicit contracts as abstractness markers", () => {
  const report = analyzePackageMetrics(new Map([
    ["src/features/a/application/contracts.port.js", "/** @typedef {Object} Port */ export const token = Symbol();"],
    ["src/features/a/application/use.js", "export const use = 1;"],
  ]));
  const row = report.packages[0]; assert.equal(row.abstractModules, 1); assert.equal(row.A, 0.5); assert.equal(row.D, 0.5);
});

test("source metrics enforce smaller core modules while preserving a migration ceiling", () => {
  const metric = measureSource("src/features/a/domain/a.js", "if (x) {\n  y();\n}\n"); assert.equal(metric.lines, 4); assert.ok(metric.decisions >= 1);
  assert.equal(budgetViolations([{ file: "src/features/a/domain/a.js", lines: 301 }]).length, 1);
  assert.equal(budgetViolations([{ file: "src/features/a/presentation/a.jsx", lines: 600 }]).length, 0);
  assert.equal(budgetViolations([{ file: "src/features/a/presentation/a.jsx", lines: 901 }]).length, 1);
});

import test from "node:test";
import assert from "node:assert/strict";
import { analyzePackageMetrics, packageOf } from "../../scripts/package-metrics.mjs";
import { measureSource, budgetFor, budgetViolations, migrationDebt, LEGACY_PRESENTATION_CEILINGS } from "../../scripts/source-quality.mjs";

test("package metrics compute Ca/Ce/I/A/D and identify stability relations", () => {
  const sources = new Map([
    ["src/features/a/domain/a.js", "export const a = 1;"],
    ["src/features/b/application/b.js", 'import "../../a/domain/a.js"; export const b = 2;'],
    ["src/app/main.js", 'import "../features/b/application/b.js";'],
  ]);
  const report = analyzePackageMetrics(sources);
  const a = report.packages.find((row) => row.package === "features/a");
  const b = report.packages.find((row) => row.package === "features/b");
  assert.equal(a.ca, 1); assert.equal(a.ce, 0); assert.equal(a.I, 0);
  assert.equal(b.ca, 1); assert.equal(b.ce, 1); assert.equal(b.I, 0.5);
  assert.equal(typeof a.D, "number"); assert.deepEqual(report.sdpViolations, []);
  assert.equal(packageOf("src/shared/domain/a.js"), "shared/domain");
  assert.equal(packageOf("src/app/a.js"), "app");
});

test("package metrics recognize explicit contracts as abstractness markers", () => {
  const report = analyzePackageMetrics(new Map([
    ["src/features/a/application/contracts.port.js", "/** @typedef {Object} Port */ export const token = Symbol();"],
    ["src/features/a/application/use.js", "export const use = 1;"],
  ]));
  const row = report.packages[0];
  assert.equal(row.abstractModules, 1); assert.equal(row.A, 0.5); assert.equal(row.D, 0.5);
});

test("source budgets enforce 300 core, 500 new presentation and frozen legacy ceilings", () => {
  const metric = measureSource("src/features/a/domain/a.js", "if (x) {\n  y();\n}\n");
  assert.equal(metric.lines, 4); assert.ok(metric.decisions >= 1);
  assert.equal(budgetFor("src/features/a/domain/a.js"), 300);
  assert.equal(budgetFor("src/features/a/presentation/new.jsx"), 500);
  assert.equal(budgetFor("src/features/league/presentation/page-league.jsx"), LEGACY_PRESENTATION_CEILINGS["src/features/league/presentation/page-league.jsx"]);
  assert.equal(budgetViolations([{ file: "src/features/a/domain/a.js", lines: 301 }]).length, 1);
  assert.equal(budgetViolations([{ file: "src/features/a/presentation/a.jsx", lines: 501 }]).length, 1);
  assert.equal(budgetViolations([{ file: "src/features/a/presentation/a.jsx", lines: 500 }]).length, 0);
  assert.equal(budgetViolations([{ file: "src/features/league/presentation/page-league.jsx", lines: 1201 }]).length, 1);
  assert.equal(migrationDebt([{ file: "x", lines: 501 }, { file: "y", lines: 500 }]).length, 1);
});

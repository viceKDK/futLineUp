import test from "node:test";
import assert from "node:assert/strict";
import { validateJsonTree } from "../../src/shared/domain/json-tree.js";
import { createBackupSchema } from "../../src/features/backup/domain/backup-schema.js";
import { createBackupService } from "../../src/features/backup/application/backup-service.js";
import { createStore } from "../../src/shared/application/store.js";
import { createMemoryStorage } from "../../src/shared/infrastructure/memory-storage.js";
import { createLocalStorageAdapter } from "../../src/shared/infrastructure/local-storage.js";
import { fisherYates } from "../../src/features/draw/domain/shuffle.js";
import { initials, contrastText, contrastTextMixed, colorFor, nextPlayerId, relDate } from "../../src/shared/domain/display.js";
import { createSnapshotService } from "../../src/features/sharing/application/snapshot-service.js";
import { createBase64UrlCodec } from "../../src/shared/infrastructure/base64url.js";
const payload = (data = { roster: [] }, schemaVersion = 2) => ({ app: "futbolClub", schemaVersion, data });
const fixture = () => {
  const storage = createMemoryStorage();
  const events = [];
  const errors = [];
  const store = createStore({
    storage, onChange: (event) => events.push(event), onError: (event) => errors.push(event)
  });
  const service = createBackupService({ reader: store, writer: store, clock: () => new Date("2026-01-01T00:00:00Z") });
  return { storage, store, service, events, errors };
};
test("JSON accepts only finite, bounded plain JSON trees", () => {
  validateJsonTree({ values: [null, true, 2, "ok"] });
  for (const value of [undefined, NaN, Infinity, () => { }, 1n, new Date(), new Map()])
    assert.throws(() => validateJsonTree(value));
  for (const key of ["__proto__", "constructor", "prototype"])
    assert.throws(() => validateJsonTree(JSON.parse(`{"${key}":1}`)), /claves/);
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => validateJsonTree(cyclic), /profunda/);
  assert.throws(() => validateJsonTree("x".repeat(250001)), /texto/);
  assert.throws(() => validateJsonTree(Array(5001).fill(0)), /listas/);
  assert.throws(() => validateJsonTree(Object.fromEntries(Array.from({ length: 1001 }, (_, i) => [i, 0]))), /objetos/);
  assert.throws(() => validateJsonTree([Array(4999).fill(0), Array(4999).fill(0)], { maxNodes: 5000 }), /datos/);
  assert.throws(() => validateJsonTree({ a: { b: 0 } }, { maxDepth: 1 }), /profunda/);
});
test("backup schema preserves v1 compatibility and whitelists keys", () => {
  const schema = createBackupSchema();
  assert.equal(schema.validate({ app: "futbolClub", data: { roster: [], unknown: 1 } }).schemaVersion, 1);
  assert.deepEqual(schema.validate(payload({ roster: [], unknown: 1 })).data, { roster: [] });
  for (const version of [0, -1, 1.5, 3, "bad", null])
    assert.throws(() => schema.validate(payload({ roster: [] }, version)), /versión/);
  for (const bad of [null, {}, { app: "other", data: {} }, payload([]), payload({ unknown: 1 })])
    assert.throws(() => schema.validate(bad));
  for (const key of ["roster", "teams", "competitions"]) {
    for (const value of [false, null, 0, {}, ""])
      assert.throws(() => schema.validate(payload({ [key]: value })));
    assert.throws(() => schema.validate(payload({ [key]: Array(key === "competitions" ? 51 : 201).fill({}) })), /límite/);
  }
});
test("OCP: add a backup field without editing validation or use cases", () => {
  const schema = createBackupSchema({ fieldValidators: { tactics: (value) => assert.equal(typeof value, "string") } });
  assert.deepEqual(schema.validate(payload({ tactics: "press" })).data, { tactics: "press" });
  assert.throws(() => schema.validate(payload({ tactics: 1 })));
  assert.throws(() => createBackupSchema({ fieldValidators: { roster: () => { } } }), /registrad/);
  assert.throws(() => createBackupSchema({ fieldValidators: { foo: 1 } }), /función/);
});
test("store provides stable snapshots, falsy values and unsubscribe", () => {
  const { store, storage, events } = fixture();
  const values = [];
  const unsubscribe = store.subscribe("roster", (value) => values.push(value));
  store.save("roster", [{ id: 1 }]);
  assert.strictEqual(store.load("roster"), store.load("roster"));
  assert.equal(values.length, 1);
  unsubscribe();
  unsubscribe();
  store.save("roster", []);
  assert.equal(values.length, 1);
  assert.equal(events.length, 2);
  for (const value of [null, false, 0, ""]) {
    store.save("value", value);
    assert.equal(store.load("value", "fallback"), value);
  }
  storage.removeItem("value");
  assert.equal(store.load("value", "fallback"), "fallback");
  store.remove("roster");
  assert.deepEqual(store.keys(), []);
  assert.equal(store.load("missing", "fallback"), "fallback");
  assert.throws(() => store.subscribe("roster", null), /función/);
  assert.throws(() => store.save("x", undefined), /JSON/);
});
test("quota failure retains unsaved edits and failed deletions as session tombstones", () => {
  const base = createMemoryStorage();
  let fail = false;
  const storage = {
    ...base, setItem(key, value) { if (fail)
      throw Error("quota"); base.setItem(key, value); }, removeItem(key) { if (fail)
      throw Error("quota"); base.removeItem(key); }
  };
  const errors = [];
  const store = createStore({ storage, onError: (e) => errors.push(e) });
  store.save("team", { name: "old" });
  fail = true;
  store.save("team", { name: "new" });
  assert.deepEqual(store.load("team"), { name: "new" });
  store.remove("team");
  assert.equal(store.load("team", "gone"), "gone");
  assert.deepEqual(store.keys(), []);
  assert.equal(errors.length, 2);
});
test("storage failures and observer failures do not crash regular editing", () => {
  const broken = {
    getItem() { throw Error("denied"); }, setItem() { throw Error("denied"); }, removeItem() { throw Error("denied"); }, keys() { throw Error("denied"); }
  };
  const store = createStore({
    storage: broken, onChange() { throw Error("observer"); }, onError() { throw Error("reporter"); }
  });
  assert.equal(store.load("x", 1), 1);
  store.subscribe("x", () => { throw Error("subscriber"); });
  store.save("x", 2);
  assert.equal(store.load("x"), 2);
  assert.deepEqual(store.keys(), ["x"]);
  store.remove("x");
  assert.equal(store.load("x", 1), 1);
});
test("cross-tab invalidation handles updates, remove and clear", () => {
  const { store, storage } = fixture();
  const seen = [];
  store.subscribe("x", (v) => seen.push(v));
  store.save("x", 1);
  storage.setItem("x", "2");
  store.invalidate("x");
  assert.equal(store.load("x"), 2);
  storage.removeItem("x");
  store.invalidate(null);
  assert.equal(seen.at(-1), undefined);
  storage.setItem("bad", "{");
  assert.equal(store.load("bad", 99), 99);
  store.save("__proto__", 7);
  assert.equal(store.load("__proto__"), 7);
});
test("backup export has an injected clock and excludes unregistered metadata", () => {
  const { store, service } = fixture();
  store.save("roster", []);
  store.save("authIntroSeen", 1);
  assert.deepEqual(service.exportData(), {
    app: "futbolClub", schemaVersion: 2, exportedAt: "2026-01-01T00:00:00.000Z", data: { roster: [] }
  });
});
test("replace protects unrelated keys; merge keeps existing application fields", () => {
  const { store, service } = fixture();
  store.save("teams", [{ id: 1 }]);
  store.save("authIntroSeen", 1);
  assert.equal(service.importData(payload({ roster: [] })), 1);
  assert.equal(store.load("teams"), undefined);
  assert.equal(store.load("authIntroSeen"), 1);
  service.importData(payload({ teams: [] }), "merge");
  assert.deepEqual(store.load("roster"), []);
  assert.throws(() => service.importData(payload(), "unknown"), /Estrategia/);
});
test("OCP: new import strategy uses the same transaction boundary", () => {
  const { store } = fixture();
  const service = createBackupService({
    reader: store, writer: store, strategies: { append: ({ data }) => ({ set: { teams: data.teams }, remove: [] }) }
  });
  service.importData(payload({ teams: [1] }), "append");
  assert.deepEqual(store.load("teams"), [1]);
  assert.throws(() => createBackupService({ reader: store, writer: store, strategies: { merge() { } } }), /registrad/);
});
test("import validates bytes, schema and strategy before any mutation", () => {
  const { store, service } = fixture();
  store.save("teams", [1]);
  assert.throws(() => service.importData(payload({ roster: "bad" })));
  assert.throws(() => service.importData(payload({ roster: [], huge: "ñ".repeat(2700000) })), /5 MB/);
  const cycle = {};
  cycle.self = cycle;
  assert.throws(() => service.importData(cycle), /JSON/);
  assert.deepEqual(store.load("teams"), [1]);
});
test("strict import rollback restores durable state without publishing partial changes", () => {
  const base = createMemoryStorage();
  let fail = false;
  const store = createStore({
    storage: {
      ...base, setItem(key, value) { if (fail && key === "roster")
        throw Error("quota"); base.setItem(key, value); }
    }
  });
  store.save("teams", [1]);
  const changes = [];
  store.subscribe("teams", (v) => changes.push(v));
  fail = true;
  const service = createBackupService({ reader: store, writer: store });
  assert.throws(() => service.importData(payload()), /restaurados/);
  assert.deepEqual(store.load("teams"), [1]);
  assert.deepEqual(JSON.parse(base.getItem("teams")), [1]);
  assert.equal(changes.length, 0);
});
test("rollback failure is reported honestly instead of claiming restoration", () => {
  const base = createMemoryStorage();
  base.setItem("teams", "[1]");
  const store = createStore({ storage: { ...base, setItem() { throw Error("disk"); } } });
  assert.throws(() => store.commit({ set: { roster: [] }, remove: ["teams"] }), (error) => error.rollbackErrors.length === 1 && /restaurar/.test(error.message));
  assert.equal(store.load("teams"), undefined);
});
test("shuffle is reproducible, does not mutate and keeps the exact multiset", () => {
  const values = [1, 2, 2, 3];
  const original = values.slice();
  assert.deepEqual(fisherYates(values, () => 0), [2, 2, 3, 1]);
  assert.deepEqual(values, original);
  assert.deepEqual(fisherYates([], () => 0), []);
  assert.deepEqual(fisherYates([1], () => 0), [1]);
  for (const bad of [-1, 1, NaN, Infinity])
    assert.throws(() => fisherYates([1, 2], () => bad), /aleator/);
});
test("display helpers cover malformed colors, names, ids and an injected date", () => {
  assert.equal(initials("  Juan   Pérez  "), "JP");
  assert.equal(initials(" \n "), "??");
  assert.equal(initials("Ana"), "AN");
  assert.equal(initials(null), "??");
  assert.equal(contrastText("#fff"), "#12181a");
  assert.equal(contrastText("#000000"), "#ffffff");
  for (const bad of [null, "red", "#12", "#0g0000"])
    assert.equal(contrastText(bad), "#ffffff");
  assert.equal(contrastTextMixed("#fff", "#fff", "stripes"), "#12181a");
  assert.equal(contrastTextMixed("#000", "#fff", "stripes"), "#ffffff");
  assert.equal(contrastTextMixed("#000", "#fff", "solid"), "#ffffff");
  assert.equal(contrastTextMixed("#fff", "bad", "stripes"), "#12181a");
  assert.equal(colorFor("same"), colorFor("same"));
  assert.notEqual(colorFor("a"), colorFor("b"));
  assert.equal(nextPlayerId([]), 1);
  assert.equal(nextPlayerId([{ id: 2 }, { id: "4" }]), 5);
  const now = Date.UTC(2026, 0, 31);
  const date = (days) => new Date(now - days * 86400000).toISOString();
  for (const [days, label] of [
    [0, "hoy"], [1, "ayer"], [5, "hace 5 días"], [14, "hace 2 sem"], [30, "hace 1 meses"]
  ])
    assert.equal(relDate(date(days), now), label);
  assert.equal(relDate("bad", now), "");
});
test("snapshot codec round-trips Unicode and rejects invalid envelopes", () => {
  const service = createSnapshotService({ codec: createBase64UrlCodec(), supportsMode: (mode) => [5, 7, 11].includes(mode) });
  const snapshot = { draft: { mode: 7 }, roster: [{ name: "José ⚽" }] };
  assert.deepEqual(service.decode(service.encode(snapshot)), { ...snapshot, v: 1 });
  for (const value of [
    null, {}, { draft: { mode: 9 } }, { draft: {}, roster: false }, { draft: {}, roster: Array(101).fill(0) }
  ])
    assert.throws(() => service.encode(value));
  assert.throws(() => service.decode("!bad"));
  assert.throws(() => service.decode("a".repeat(60001)), /grande/);
  assert.throws(() => service.encode({ draft: { mode: 7 }, extra: "x".repeat(60000) }), /grande/);
  assert.throws(() => service.decode(createBase64UrlCodec().encode(JSON.stringify({ v: 2, draft: {} }))), /inválida/);
});
test("localStorage adapter namespaces keys and resolves access lazily", () => {
  const data = new Map([["unrelated", "1"], ["fc.v1.roster", "[]"]]);
  const storage = {
    get length() { return data.size; }, key: (i) => [...data.keys()][i] ?? null, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k)
  };
  const adapter = createLocalStorageAdapter(() => storage);
  assert.deepEqual(adapter.keys(), ["roster"]);
  adapter.setItem("teams", "[]");
  assert.equal(adapter.getItem("teams"), "[]");
  adapter.removeItem("teams");
  assert.equal(adapter.getItem("teams"), null);
  assert.equal(data.get("unrelated"), "1");
  const blocked = createLocalStorageAdapter(() => { throw Error("blocked"); });
  assert.throws(() => blocked.getItem("x"), /blocked/);
});

test("unsubscribe is idempotent and cannot remove a later subscription", () => {
  const store = createStore({ storage: createMemoryStorage() });
  const unsubscribe = store.subscribe("a", () => {});
  unsubscribe();
  let calls = 0;
  store.subscribe("a", () => calls++);
  unsubscribe();
  store.save("a", 1);
  assert.equal(calls, 1);
});
test("reentrant observers cannot turn a completed commit into a failure", () => {
  const store = createStore({ storage: createMemoryStorage() });
  store.subscribe("a", () => store.remove("b"));
  assert.doesNotThrow(() => store.commit({ set: { a: 1, b: 2 } }));
  assert.equal(store.load("a"), 1);
  assert.equal(store.load("b", null), null);
});

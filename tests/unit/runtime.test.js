import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserRuntime } from "../../src/app/install-browser-runtime.js";
import { createRuntime } from "../../src/app/create-runtime.js";
import { createMemoryStorage } from "../../src/shared/infrastructure/memory-storage.js";
import { createBase64UrlCodec } from "../../src/shared/infrastructure/base64url.js";
import { createBackupSchema } from "../../src/features/backup/domain/backup-schema.js";
import { createBackupService } from "../../src/features/backup/application/backup-service.js";
import { createRegistry } from "../../src/shared/domain/registry.js";
import { FORMATIONS, DEFAULT_ROSTER } from "../../src/features/lineup/domain/catalog.js";
import { fisherYates } from "../../src/features/draw/domain/shuffle.js";
import { relDate, contrastTextMixed, nextPlayerId } from "../../src/shared/domain/display.js";
function browser() {
  const data = new Map();
  const listeners = new Map();
  const events = [];
  const target = {
    localStorage: {
      get length() { return data.size; }, key: (i) => [...data.keys()][i] ?? null, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k)
    },
    CustomEvent: class {
      constructor(type, { detail }) { this.type = type; this.detail = detail; }
    },
    dispatchEvent: (event) => events.push(event),
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn)
      listeners.delete(name); },
  };
  return { target, listeners, events, data };
}
test("browser runtime preserves legacy APIs and synchronizes cross-tab updates", () => {
  const { target, listeners, data, events } = browser();
  const runtime = installBrowserRuntime(target);
  assert.equal(target.decodeLineupSnapshot(target.encodeLineupSnapshot({ draft: { mode: 7 } })).draft.mode, 7);
  assert.deepEqual(target.ROSTER, DEFAULT_ROSTER);
  assert.equal(target.SAVED_TEAMS.length, 4);
  target.db.save("roster", [{ id: 99 }]);
  assert.deepEqual(target.ROSTER, [{ id: 99 }]);
  assert.equal(target.exportFutbolClubData().schemaVersion, 2);
  target.db.save("teams", []);
  const changed = listeners.get("storage");
  data.set("fc.v1.teams", "[1]");
  changed({ key: "fc.v1.teams", storageArea: target.localStorage });
  assert.deepEqual(target.SAVED_TEAMS, [1]);
  changed({ key: "other" });
  changed({ key: "fc.v1.teams", storageArea: {} });
  data.clear();
  changed({ key: null });
  assert.equal(target.SAVED_TEAMS.length, 4);
  assert.ok(events.some((e) => e.type === "fc:data-changed"));
  installBrowserRuntime(target);
  assert.equal(listeners.size, 1);
  target.fcRuntime.dispose();
  assert.equal(listeners.size, 0);
  runtime.dispose();
});
test("RESET_ON_BOOT only clears namespaced storage and errors are observable", () => {
  const { target, data, events, listeners } = browser();
  target.RESET_ON_BOOT = true;
  data.set("fc.v1.teams", "[]");
  data.set("foreign", "1");
  installBrowserRuntime(target);
  assert.deepEqual([...data.keys()], ["foreign"]);
  Object.defineProperty(target, "localStorage", { get() { throw Error("blocked"); } });
  installBrowserRuntime(target);
  listeners.get("storage")({ key: "fc.v1.x", storageArea: {} });
  assert.ok(events.some((e) => e.type === "fc:storage-error"));
  target.db.save("x", 1);
  assert.equal(target.db.load("x"), 1);
});
test("independent runtimes have independent defaults and extension policies", () => {
  const a = browser(), b = browser();
  installBrowserRuntime(a.target);
  installBrowserRuntime(b.target);
  a.target.DEFAULT_ROSTER[0].name = "changed";
  assert.notEqual(a.target.ROSTER[0].name, b.target.ROSTER[0].name);
  const runtime = createRuntime({
    storage: createMemoryStorage(), codec: createBase64UrlCodec(), supportsMode: (mode) => mode === 9, fieldValidators: { tactics: () => { } }
  });
  runtime.backup.importData({ app: "futbolClub", data: { tactics: "press" } });
  assert.equal(runtime.store.load("tactics"), "press");
  assert.equal(runtime.snapshots.decode(runtime.snapshots.encode({ draft: { mode: 9 } })).draft.mode, 9);
});
test("formation catalog has valid player counts and positions for every mode", () => {
  for (const [mode, formations] of Object.entries(FORMATIONS)) {
    assert.equal(new Set(formations.map((item) => item.name)).size, formations.length);
    for (const item of formations) {
      assert.equal(item.positions.length, Number(mode));
      for (const [x, y] of item.positions)
        assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100);
    }
  }
  assert.equal(new Set(DEFAULT_ROSTER.map((player) => player.id)).size, DEFAULT_ROSTER.length);
});
test("JSON fields use the default field validator; registry results cannot mutate it", () => {
  const schema = createBackupSchema();
  assert.equal(schema.validate({ app: "futbolClub", data: { profile: { displayName: "A" } } }).data.profile.displayName, "A");
  const registry = createRegistry({ a: () => 1 });
  const keys = registry.keys();
  keys.push("b");
  assert.deepEqual(registry.keys(), ["a"]);
});
test("edge defaults do not require real timers or external services", () => {
  assert.deepEqual(fisherYates([]), []);
  assert.equal(typeof relDate("bad"), "string");
  assert.equal(contrastTextMixed("#fff", "#000"), "#12181a");
  assert.equal(nextPlayerId([{ id: "bad" }]), 1);
  const store = createRuntime({
    storage: createMemoryStorage(), codec: createBase64UrlCodec(), supportsMode: () => true
  }).store;
  const service = createBackupService({ reader: store, writer: store });
  assert.throws(() => service.importData(undefined), /JSON/);
  assert.deepEqual(service.exportData().data, {});
});

test("cached keys remain exportable when storage enumeration is blocked", () => {
  const memory = createMemoryStorage();
  let blocked = false;
  const runtime = createRuntime({
    storage: { ...memory, keys() { if (blocked) throw Error("blocked"); return memory.keys(); } },
    codec: createBase64UrlCodec(), supportsMode: () => true,
  });
  runtime.store.save("roster", [{ id: 1 }]);
  blocked = true;
  assert.deepEqual(runtime.backup.exportData().data.roster, [{ id: 1 }]);
});
test("explicit invalid modes are not silently converted into seven-a-side", () => {
  const { target } = browser();
  installBrowserRuntime(target);
  for (const mode of [0, false, "bad"]) {
    assert.throws(() => target.encodeLineupSnapshot({ draft: { mode } }), /modo/);
  }
});

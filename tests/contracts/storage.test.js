import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStorage } from "../../src/shared/infrastructure/memory-storage.js";
import { createLocalStorageAdapter } from "../../src/shared/infrastructure/local-storage.js";
import { createStore } from "../../src/shared/application/store.js";
function browserStorage() {
  const data = new Map();
  return {
    get length() { return data.size; }, key: (i) => [...data.keys()][i] ?? null,
    getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, String(v)); }, removeItem: (k) => { data.delete(k); }
  };
}
const implementations = {
  memory: createMemoryStorage,
  localStorage: () => { const storage = browserStorage(); return createLocalStorageAdapter(() => storage); },
};
for (const [name, create] of Object.entries(implementations)) {
  test(`${name}: shared raw storage contract (LSP)`, () => {
    const storage = create();
    assert.equal(storage.getItem("missing"), null);
    assert.deepEqual(storage.keys(), []);
    storage.setItem("z", "0");
    storage.setItem("a", "false");
    storage.setItem("z", "null");
    assert.equal(storage.getItem("z"), "null");
    assert.deepEqual(storage.keys(), ["a", "z"]);
    storage.removeItem("z");
    storage.removeItem("missing");
    assert.equal(storage.getItem("z"), null);
    assert.deepEqual(create().keys(), []);
  });
  test(`${name}: same observable repository contract`, () => {
    const store = createStore({ storage: create() });
    const values = [];
    store.subscribe("a", (value) => values.push(value));
    store.commit({ set: { a: [1], b: false }, remove: [] });
    assert.deepEqual(store.load("a"), [1]);
    assert.equal(store.load("b"), false);
    store.commit({ set: { a: [2] }, remove: ["b", "b", "a"] });
    assert.deepEqual(store.load("a"), [2]);
    assert.deepEqual(store.keys(), ["a"]);
    assert.deepEqual(values, [[1], [2]]);
    store.commit({});
  });
}

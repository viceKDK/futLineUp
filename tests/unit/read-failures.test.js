import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../../src/shared/application/store.js";
import { createMemoryStorage } from "../../src/shared/infrastructure/memory-storage.js";

test("a readable snapshot survives later denied reads and malformed persisted JSON", () => {
  const memory = createMemoryStorage();
  const errors = [];
  let denied = false;
  const store = createStore({
    storage: {
      ...memory,
      getItem(key) {
        if (denied) throw new Error("denied");
        return memory.getItem(key);
      },
    },
    onError: (error) => errors.push(error),
  });
  store.save("roster", [{ id: 1 }]);
  const snapshot = store.load("roster");
  denied = true;
  assert.strictEqual(store.load("roster", []), snapshot);
  denied = false;
  memory.setItem("roster", "{");
  assert.strictEqual(store.load("roster", []), snapshot);
  assert.equal(errors.length, 2);
});

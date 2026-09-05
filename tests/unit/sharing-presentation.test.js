import test from "node:test";
import assert from "node:assert/strict";
import { createSharePreview } from "../../src/features/sharing/presentation/share-preview.js";
import { createShareControls } from "../../src/features/sharing/presentation/share-controls.js";
import { buildShareModel } from "../../src/features/sharing/domain/share-model.js";

// Element-tree contract tests for stateless views, not a substitute for React DOM/E2E.
const React = {
  createElement: (type, props, ...children) => ({
    type,
    props: { ...props, children },
  }),
};
function expand(node) {
  if (node == null || typeof node === "boolean") return null;
  if (Array.isArray(node)) return node.map(expand);
  if (typeof node !== "object") return node;
  if (typeof node.type === "function") return expand(node.type(node.props));
  return {
    ...node,
    props: { ...node.props, children: node.props.children.map(expand) },
  };
}
function flatten(node) {
  if (node == null) return [];
  if (Array.isArray(node)) return node.flatMap(flatten);
  return typeof node === "object"
    ? [node, ...flatten(node.props.children)]
    : [node];
}
const formations = {
  5: [{ name: "1-2-1", positions: Array(5).fill([50, 50]) }],
};
const model = (include = {}) =>
  buildShareModel(
    {
      draft: { mode: 5, name: "Team", assignedIds: [1], captainId: 1 },
      roster: [{ id: 1, name: "Ana", num: 1, pos: "ARQ" }],
      match: {
        date: "2026-09-11",
        time: "20:00",
        venue: "Cancha",
        myScore: 2,
        theirScore: 1,
        opponent: "B",
      },
      include,
    },
    formations,
  );
const Pitch = (props) => React.createElement("test-pitch", props);
const Kit = (props) => React.createElement("test-kit", props);

test("all three preview layouts preserve presentation capabilities without application globals", () => {
  const preview = createSharePreview({ React, Pitch, Kit });
  assert.deepEqual(
    preview.options.map((option) => option.id),
    ["card", "list", "stories"],
  );
  for (const style of ["card", "list", "stories"]) {
    const ref = {},
      tree = expand(
        preview.Component({
          style,
          model: model({ stats: true }),
          captureRef: ref,
        }),
      );
    assert.strictEqual(tree.props.ref, ref);
    assert.match(tree.props.className, /share-card/);
    assert.ok(flatten(tree).includes("TEAM"));
    assert.ok(flatten(tree).includes("futbolClub.app"));
  }
  const card = flatten(
    expand(
      preview.Component({
        style: "card",
        model: model({ stats: true }),
        captureRef: {},
      }),
    ),
  );
  assert.ok(card.includes("Ana"));
  assert.ok(card.includes("2–1"));
  assert.equal(
    card.find((node) => node?.type === "test-pitch").props.interactive,
    false,
  );
});

test("preview privacy and extension contracts are checked independently of the React renderer", () => {
  const preview = createSharePreview({
    React,
    Pitch,
    Kit,
    layouts: { custom: () => React.createElement("custom") },
  });
  assert.equal(
    expand(preview.Component({ style: "custom", model: model() })).type,
    "custom",
  );
  assert.throws(
    () => preview.Component({ style: "missing", model: model() }),
    /Diseño/,
  );
  assert.throws(
    () =>
      createSharePreview({ React, Pitch, Kit, layouts: { card: () => null } }),
    /registrado/,
  );
  for (const style of ["card", "list", "stories"]) {
    const flat = flatten(
      expand(
        preview.Component({
          style,
          model: model({
            names: false,
            venue: false,
            kit: false,
            watermark: false,
          }),
        }),
      ),
    );
    assert.ok(!flat.includes("Ana"));
    assert.ok(!flat.includes("futbolClub.app"));
    assert.ok(!flat.some((node) => node?.type === "test-kit"));
  }
});

test("controls dispatch explicit actions and expose accessible field labels", () => {
  const calls = [];
  const actions = Object.fromEntries(
    [
      "setPlayerStyle",
      "setKitMode",
      "setMatch",
      "copyLink",
      "openChannel",
      "toggleInclude",
      "exportFile",
    ].map((name) => [name, (...args) => calls.push([name, ...args])]),
  );
  const Controls = createShareControls(React);
  const flat = flatten(
    expand(
      Controls({
        model: model(),
        hasAltKit: true,
        kitMode: "main",
        playerStyle: "photo",
        link: "https://example.test/",
        busy: false,
        formats: ["png", "pdf", "ics", "svg"],
        actions,
      }),
    ),
  );
  const button = (label) =>
    flat.find(
      (node) => node?.type === "button" && node.props.children.includes(label),
    );
  button("Alternativa").props.onClick();
  button("Camiseta").props.onClick();
  button("WhatsApp").props.onClick();
  button("SVG").props.onClick();
  const date = flat.find(
    (node) => node?.type === "input" && node.props.type === "date",
  );
  date.props.onChange({ target: { value: "2026-09-12" } });
  assert.deepEqual(calls, [
    ["setKitMode", "alt"],
    ["setPlayerStyle", "shirt"],
    ["openChannel", "whatsapp"],
    ["exportFile", "svg"],
    ["setMatch", "date", "2026-09-12"],
  ]);
  const linkInput = flat.find(
    (node) => node?.props?.["aria-label"] === "Enlace de alineación",
  );
  assert.equal(linkInput.props.readOnly, true);
  const disabled = flatten(
    expand(
      Controls({
        model: model(),
        hasAltKit: false,
        busy: true,
        formats: ["png"],
        actions,
      }),
    ),
  );
  assert.ok(
    disabled
      .filter(
        (node) =>
          node?.type === "button" &&
          /social|export-opt/.test(node.props.className || ""),
      )
      .every((node) => node.props.disabled),
  );
});

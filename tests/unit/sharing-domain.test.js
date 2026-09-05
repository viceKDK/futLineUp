import test from "node:test";
import assert from "node:assert/strict";
import {
  buildShareModel,
  fileSlug,
} from "../../src/features/sharing/domain/share-model.js";
import {
  createCalendarEvent,
  escapeCalendarText,
  foldCalendarLine,
} from "../../src/features/sharing/domain/calendar-event.js";
import {
  parseCivilDate,
  parseClockTime,
  addCivilDays,
} from "../../src/shared/domain/civil-date.js";
import { createSnapshotService } from "../../src/features/sharing/application/snapshot-service.js";
import { createBase64UrlCodec } from "../../src/shared/infrastructure/base64url.js";

const formations = {
  5: [{ name: "1-2-1", positions: Array(5).fill([50, 50]) }],
  7: [{ name: "2-3-1", positions: Array(7).fill([50, 50]) }],
};
const sample = () => ({
  draft: {
    name: "Peñarol ⚽",
    mode: 5,
    assignedIds: [1, 2],
    substituteIds: [3],
    captainId: 2,
    kit: { design: "solid", primary: "#111111", secondary: "#ffffff" },
  },
  roster: [
    { id: 1, name: "José", num: 10, pos: "MED" },
    { id: 2, name: "Ana", num: 1, pos: "ARQ" },
    { id: 3, name: "Luis", num: 9, pos: "DEL" },
    { id: 4, name: "Privado", privateNote: "No compartir" },
  ],
  match: {
    date: "2026-09-11",
    time: "21:30",
    venue: "Cancha",
    opponent: "Rival",
    myScore: 2,
    theirScore: 1,
  },
});
const snapshotService = () =>
  createSnapshotService({
    codec: createBase64UrlCodec(),
    supportsMode: (mode) => Object.hasOwn(formations, mode),
  });

test("sharing accepts ordinary players without optional properties and round-trips Unicode", () => {
  const input = sample();
  const model = buildShareModel(input, formations);
  const snapshots = snapshotService();
  const decoded = snapshots.decode(snapshots.encode(model.payload));
  assert.equal(decoded.roster[0].name, "José");
  assert.equal(decoded.roster.length, 3);
  assert.equal(model.players.length, 5);
  assert.equal(model.captain, "Ana");
  assert.equal(model.slug, "penarol");
  assert.equal(JSON.stringify(decoded).includes("Privado"), false);
  assert.equal(model.payload.draft.formIdx, 0);
  assert.deepEqual(
    input,
    sample(),
    "projection never mutates the editor or roster",
  );
});

test("share privacy options apply to the URL payload, not just the preview", () => {
  const input = sample();
  input.roster[0].photo = "data:image/png;base64,YQ==";
  const model = buildShareModel(
    {
      ...input,
      include: { names: false, kit: false, venue: false, stats: false },
    },
    formations,
  );
  const serialized = JSON.stringify(model.payload);
  for (const secret of [
    "José",
    "Ana",
    "Luis",
    "Cancha",
    "21:30",
    "#111111",
    "data:image",
  ])
    assert.ok(!serialized.includes(secret), secret);
  assert.equal(model.captain, "—");
  assert.equal(model.payload.match.myScore, null);
  assert.equal(model.payload.match.date, "");
  assert.equal(
    model.match.date,
    input.match.date,
    "editable source values are kept out of the public payload",
  );
  assert.equal(model.include.watermark, true);
});

test("alternate kit, free positions and captain are derived from the actual selection", () => {
  const input = sample();
  input.draft.altKit = {
    design: "sash",
    primary: "#ff0000",
    secondary: "#000000",
  };
  input.draft.freeMode = true;
  input.draft.freePositions = {
    "5:0": [
      [10, 20],
      [40, 60],
    ],
    "7:9": [[90, 90]],
  };
  const model = buildShareModel(
    { ...input, kitMode: "alt", include: { stats: true } },
    formations,
  );
  assert.equal(model.kit.design, "sash");
  assert.equal(
    model.payload.draft.activeKit,
    "main",
    "a shared kit is a self-contained selected kit",
  );
  assert.equal(model.payload.draft.kit.primary, "#ff0000");
  assert.equal(model.payload.match.myScore, 2);
  assert.deepEqual(model.overrides.slice(0, 2), [
    [10, 20],
    [40, 60],
  ]);
  assert.deepEqual(Object.keys(model.payload.draft.freePositions), ["5:0"]);
  model.overrides[0][0] = 99;
  assert.equal(input.draft.freePositions["5:0"][0][0], 10);
});

test("malformed formation indexes fall back safely; unsupported modes fail explicitly", () => {
  for (const formIdx of [-1, 99, "bad", 1.2])
    assert.equal(
      buildShareModel(
        { ...sample(), draft: { ...sample().draft, formIdx } },
        formations,
      ).formIdx,
      0,
    );
  for (const mode of [0, false, 9, "bad"])
    assert.throws(
      () =>
        buildShareModel(
          { ...sample(), draft: { ...sample().draft, mode } },
          formations,
        ),
      /modo/i,
    );
  assert.throws(() => buildShareModel(sample(), {}), /modo/i);
});

test("projection deduplicates slots, ignores unknown players and sanitizes invalid coordinates", () => {
  const input = sample();
  input.draft.assignedIds = [1, 1, 999, 2, null, 3];
  input.draft.freeMode = true;
  input.draft.freePositions = {
    "5:0": [[-1, 20], [20, Infinity], null, [0, 100]],
  };
  input.draft.captainId = 999;
  const model = buildShareModel(input, formations);
  assert.deepEqual(model.payload.draft.assignedIds, [1, null, null, 2, null]);
  assert.deepEqual(model.overrides, [null, null, null, [0, 100], null]);
  assert.equal(model.captain, "—");
  assert.equal(model.players.filter(Boolean).length, 2);
});

test("empty and odd optional data produce bounded valid JSON", () => {
  const model = buildShareModel(
    { draft: {}, roster: [], match: {}, include: { names: "false" } },
    formations,
  );
  assert.equal(model.mode, 7);
  assert.equal(model.include.names, true);
  assert.equal(model.captain, "—");
  assert.equal(model.slug, "mi-equipo");
  assert.doesNotThrow(() => snapshotService().encode(model.payload));
  assert.equal(fileSlug(" ⚽ "), "equipo");
  assert.equal(fileSlug("../../á ; C"), "a-c");
  assert.equal(fileSlug("x".repeat(300)).length, 80);
});

test("civil dates reject normalization of impossible dates, including non-leap February", () => {
  assert.deepEqual(parseCivilDate("2024-02-29"), [2024, 2, 29]);
  for (const value of [
    "2023-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-01",
    "2026-01-00",
    "2026-2-1",
    "",
    null,
  ])
    assert.throws(() => parseCivilDate(value), /Fecha/);
  assert.deepEqual(parseClockTime("00:00"), [0, 0]);
  assert.deepEqual(parseClockTime("23:59"), [23, 59]);
  for (const value of ["24:00", "12:60", "1:00", "", null])
    assert.throws(() => parseClockTime(value), /Hora/);
  assert.equal(addCivilDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addCivilDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addCivilDays("2026-01-01", -1), "2025-12-31");
  assert.throws(() => addCivilDays("2026-01-01", 1.5), /días/);
});

test("calendar exports UTC instants with CRLF, duration and safe text fields", () => {
  const text = createCalendarEvent({
    startsAt: "2026-12-31T23:30:00Z",
    createdAt: "2026-09-05T12:00:00Z",
    uid: "match-1",
    summary: "A, B; C\\D\r\nBEGIN:VALARM",
    location: "Cancha",
    description: "José ⚽",
  });
  assert.match(text, /DTSTART:20261231T233000Z\r\nDTEND:20270101T010000Z/);
  assert.match(text, /DTSTAMP:20260905T120000Z/);
  assert.match(text, /SUMMARY:A\\, B\\; C\\\\D\\nBEGIN:VALARM/);
  assert.ok(!text.includes("\r\nBEGIN:VALARM"));
  assert.ok(text.endsWith("END:VCALENDAR\r\n"));
  assert.equal(escapeCalendarText(null), "");
  assert.equal(escapeCalendarText("a\rb\nc"), "a\\nb\\nc");
});

test("calendar folding observes 75 UTF-8 octets without splitting code points", () => {
  const input = "DESCRIPTION:" + "Peñarol ⚽😀 ".repeat(30);
  const folded = foldCalendarLine(input);
  assert.equal(folded.replace(/\r\n /g, ""), input);
  for (const line of folded.split("\r\n"))
    assert.ok(new TextEncoder().encode(line).byteLength <= 75);
  assert.equal(foldCalendarLine("X:"), "X:");
});

test("calendar rejects missing instants, unsafe IDs and invalid duration", () => {
  const base = {
    startsAt: "2026-01-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    uid: "x",
    summary: "A",
  };
  for (const startsAt of [
    "bad",
    "2026-01-01T00:00:00",
    "2026-02-30T00:00:00Z",
    null,
  ])
    assert.throws(() => createCalendarEvent({ ...base, startsAt }));
  for (const durationMinutes of [0, -1, 1.5, Infinity, 10081])
    assert.throws(
      () => createCalendarEvent({ ...base, durationMinutes }),
      /Duración/,
    );
  assert.throws(
    () => createCalendarEvent({ ...base, createdAt: "bad" }),
    /instante/i,
  );
  assert.throws(
    () => createCalendarEvent({ ...base, uid: "x\r\nINJECT" }),
    /Identificador/,
  );
});

test("snapshot errors distinguish oversize links from invalid input", () => {
  const service = snapshotService();
  for (const value of [
    null,
    {},
    { draft: [] },
    { draft: { mode: 9 } },
    { draft: {}, roster: false },
    { draft: {}, roster: Array(101).fill(0) },
  ])
    assert.throws(() => service.encode(value));
  assert.throws(
    () => service.encode({ draft: { mode: 5 }, extra: "x".repeat(60000) }),
    (error) => error.code === "SHARE_TOO_LARGE",
  );
  assert.throws(
    () => service.decode("x".repeat(60001)),
    (error) => error.code === "SHARE_TOO_LARGE",
  );
  assert.throws(() => service.decode(null));
  assert.throws(() => service.decode("!bad"));
  const codec = createBase64UrlCodec();
  assert.throws(() =>
    service.decode(codec.encode(JSON.stringify({ v: 2, draft: {} }))),
  );
  assert.throws(() => service.encode({ draft: { mode: 5 }, extra: undefined }));
});

test("calendar rejects clock normalization and supports omitted optional text fields", () => {
  const request = {
    startsAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00Z",
    uid: "x",
    summary: "A",
  };
  assert.match(createCalendarEvent(request), /LOCATION:\r\nDESCRIPTION:\r\n/);
  for (const startsAt of ["2026-01-01T24:00:00Z", "2026-01-01T00:60:00Z"])
    assert.throws(
      () => createCalendarEvent({ ...request, startsAt }),
      /instante/,
    );
});

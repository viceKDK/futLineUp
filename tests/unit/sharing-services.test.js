import test from "node:test";
import assert from "node:assert/strict";
import { createShareService } from "../../src/features/sharing/application/share-service.js";
import {
  createBrowserExporters,
  canvasBlob,
} from "../../src/features/sharing/infrastructure/browser-exporters.js";
import { createDownloadPort } from "../../src/features/sharing/infrastructure/browser-download.js";
import { createSharePorts } from "../../src/features/sharing/infrastructure/browser-share.js";
import {
  localMatchInstant,
  nextFriday,
} from "../../src/features/sharing/infrastructure/browser-time.js";

function fixture(overrides = {}) {
  const saved = [],
    copied = [],
    opened = [],
    shared = [];
  const deps = {
    snapshots: { encode: () => "encoded" },
    exporters: {
      png: async () => ({ blob: new Blob(["png"]), filename: "team.png" }),
    },
    download: (value) => saved.push(value),
    clipboard: {
      writeText: async (value) => {
        copied.push(value);
      },
    },
    nativeShare: {
      available: true,
      supportsFiles: () => false,
      share: async (value) => {
        shared.push(value);
      },
      makeFile: (data) => data,
    },
    openExternal: (url) => {
      opened.push(url);
    },
    ...overrides,
  };
  return {
    service: createShareService(deps),
    saved,
    copied,
    opened,
    shared,
    deps,
  };
}
const payload = () => ({
  draft: { mode: 5 },
  roster: [{ name: "A", photo: "photo" }],
});

test("link size fallback is classified, preserves the original and can still fail honestly", () => {
  const calls = [];
  const { service } = fixture({
    snapshots: {
      encode(value) {
        calls.push(value);
        if (value.roster[0].photo)
          throw Object.assign(Error("size"), { code: "SHARE_TOO_LARGE" });
        return "small";
      },
    },
  });
  const input = payload(),
    result = service.createLink(input, "https://example.test/app?x=1#old");
  assert.deepEqual(result, {
    url: "https://example.test/app?x=1#share=small",
    withoutPhotos: true,
  });
  assert.equal(input.roster[0].photo, "photo");
  assert.equal(calls.length, 2);
  assert.equal(
    fixture().service.createLink(input, "https://example.test/").withoutPhotos,
    false,
  );
  const bad = fixture({
    snapshots: {
      encode() {
        throw Error("invalid");
      },
    },
  }).service;
  assert.throws(
    () => bad.createLink(input, "https://example.test/"),
    /invalid/,
  );
  const huge = fixture({
    snapshots: {
      encode() {
        throw Object.assign(Error("huge"), { code: "SHARE_TOO_LARGE" });
      },
    },
  }).service;
  assert.throws(() => huge.createLink(input, "https://example.test/"), /huge/);
  assert.throws(
    () => huge.createLink({ draft: {} }, "https://example.test/"),
    /huge/,
  );
});

test("exporter registration is OCP: an added format uses the same coordinator", async () => {
  const f = fixture({
    exporters: {
      svg: async ({ model }) => ({
        blob: new Blob(["<svg/>"]),
        filename: `${model.slug}.svg`,
      }),
    },
  });
  assert.deepEqual(f.service.formats(), ["svg"]);
  await f.service.exportFile("svg", { model: { slug: "x" } });
  assert.equal(f.saved[0].filename, "x.svg");
  await assert.rejects(() => f.service.exportFile("missing", {}), /Formato/);
  assert.throws(() => fixture({ exporters: { bad: 1 } }), /función/);
  const broken = fixture({
    exporters: {
      png: async () => {
        throw Error("capture");
      },
    },
  });
  await assert.rejects(() => broken.service.exportFile("png", {}), /capture/);
  assert.equal(broken.saved.length, 0);
});

test("native sharing does not copy on cancellation and never hides other failures", async () => {
  const request = {
    title: "Team",
    text: "A",
    url: "https://example.test/",
    file: { name: "file" },
  };
  const f = fixture();
  assert.equal(await f.service.share(request), "shared");
  assert.deepEqual(f.shared[0], { title: "Team", text: "A", url: request.url });
  f.deps.nativeShare.supportsFiles = () => true;
  assert.equal(await f.service.share(request), "shared");
  assert.deepEqual(f.shared[1].files, [request.file]);
  assert.match(f.shared[1].text, /https:/);
  f.deps.nativeShare.share = async () => {
    throw Object.assign(Error("cancel"), { name: "AbortError" });
  };
  assert.equal(await f.service.share(request), "cancelled");
  assert.equal(f.copied.length, 0);
  f.deps.nativeShare.share = async () => {
    throw Error("permission");
  };
  await assert.rejects(() => f.service.share(request), /permission/);
  f.deps.nativeShare.available = false;
  assert.equal(await f.service.share(request), "copied");
  assert.deepEqual(f.copied, [request.url]);
});

test("image preparation and social channels have injectable I/O", async () => {
  const f = fixture();
  assert.equal((await f.service.prepareImage({})).filename, "team.png");
  await f.service.copyLink("copy");
  assert.deepEqual(f.copied, ["copy"]);
  for (const name of ["whatsapp", "telegram", "twitter", "instagram"]) {
    await f.service.openChannel(name, {
      text: "José & Ana",
      url: "https://example.test/?x=1",
    });
  }
  assert.match(f.opened[0], /Jos%C3%A9%20%26%20Ana/);
  assert.equal(f.opened[3], "https://instagram.com/");
  assert.ok(f.copied.at(-1).includes("José & Ana"));
  await assert.rejects(() => f.service.openChannel("unknown", {}), /Canal/);
  const custom = fixture({
    channels: { custom: () => ({ url: "https://example.test/custom" }) },
  });
  await custom.service.openChannel("custom", {});
  assert.equal(custom.opened[0], "https://example.test/custom");
  assert.throws(
    () => fixture({ channels: { whatsapp: () => "" } }),
    /registrado/,
  );
});

const model = () => ({
  slug: "team",
  draft: { name: "A" },
  formation: { name: "1-2-1" },
  mode: 5,
  players: [null, { id: 1 }],
  size: 5,
  include: { venue: true },
  match: { date: "2026-12-31", time: "23:30", venue: "Cancha", opponent: "B" },
});
const canvas = (width = 400, height = 600) => ({
  width,
  height,
  toBlob(fn) {
    fn(new Blob(["png"]));
  },
  toDataURL: () => "data:image/jpeg;base64,YQ==",
});
function exporters(options = {}) {
  return createBrowserExporters({
    capture: async () => canvas(),
    pdfFactory: () => ({
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      addImage() {},
      output: () => new Blob(["pdf"]),
    }),
    clock: () => new Date("2026-09-05T00:00:00Z"),
    idFactory: () => "match-1",
    resolveStart: () => "2026-12-31T23:30:00.000Z",
    ...options,
  });
}

test("PNG/PDF/ICS exporters produce files via ports without downloads or real services", async () => {
  const exp = exporters(),
    request = { model: model(), element: {} };
  assert.equal((await exp.png(request)).filename, "team.png");
  assert.equal((await exp.pdf(request)).filename, "team.pdf");
  const calendar = await exp.ics(request);
  assert.equal(calendar.filename, "team.ics");
  assert.match(await calendar.blob.text(), /SUMMARY:A vs B/);
  assert.match(await calendar.blob.text(), /LOCATION:Cancha/);
  request.model.include.venue = false;
  assert.match(await (await exp.ics(request)).blob.text(), /LOCATION:\r\n/);
});

test("PDF fitting handles tall and wide canvases without exceeding the page margins", async () => {
  for (const [width, height] of [
    [100, 1000],
    [1000, 100],
  ]) {
    let args;
    const exp = exporters({
      capture: async () => canvas(width, height),
      pdfFactory: () => ({
        internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
        addImage(...value) {
          args = value;
        },
        output: () => new Blob(),
      }),
    });
    await exp.pdf({ model: model(), element: {} });
    const [, , x, y, w, h] = args;
    assert.ok(x >= 10 - 1e-6 && y >= 10 - 1e-6);
    assert.ok(w <= 190 && h <= 277);
    assert.ok(Math.abs(w / h - width / height) < 1e-9);
  }
});

test("capture errors and empty blobs cannot report successful export", async () => {
  const request = { model: model(), element: {} };
  await assert.rejects(
    () => exporters().png({ model: model(), element: null }),
    /vista/,
  );
  for (const bad of [null, canvas(0, 3), canvas(2, NaN)])
    await assert.rejects(
      () => exporters({ capture: async () => bad }).png(request),
      /captura/,
    );
  await assert.rejects(
    () =>
      canvasBlob({
        toBlob(fn) {
          fn(null);
        },
      }),
    /imagen/,
  );
  await assert.rejects(
    () =>
      canvasBlob({
        toBlob() {
          throw Error("tainted");
        },
      }),
    /tainted/,
  );
  await assert.rejects(
    () => exporters({ pdfFactory: () => null }).pdf(request),
    /PDF/,
  );
});

function downloadTarget({ throwClick = false } = {}) {
  const actions = [],
    timers = [];
  const link = {
    click() {
      actions.push("click");
      if (throwClick) throw Error("click");
    },
    remove() {
      actions.push("remove");
    },
  };
  return {
    actions,
    timers,
    link,
    target: {
      document: {
        createElement: () => link,
        body: {
          appendChild() {
            actions.push("append");
          },
        },
      },
      URL: {
        createObjectURL() {
          actions.push("create");
          return "blob:test";
        },
        revokeObjectURL() {
          actions.push("revoke");
        },
      },
      setTimeout: (callback) => {
        timers.push(callback);
      },
    },
  };
}

test("download adapter removes anchors and revokes URLs on both success and failure", () => {
  const f = downloadTarget();
  createDownloadPort(f.target)({ blob: new Blob(["x"]), filename: "x.png" });
  assert.deepEqual(f.actions, ["create", "append", "click", "remove"]);
  f.timers[0]();
  assert.equal(f.actions.at(-1), "revoke");
  assert.equal(f.link.download, "x.png");
  const bad = downloadTarget({ throwClick: true });
  assert.throws(
    () => createDownloadPort(bad.target)({ blob: new Blob(), filename: "x" }),
    /click/,
  );
  assert.deepEqual(bad.actions, [
    "create",
    "append",
    "click",
    "remove",
    "revoke",
  ]);
});

test("browser share ports preserve method receivers and handle absent APIs", async () => {
  const called = [];
  const navigator = {
    share(data) {
      assert.equal(this, navigator);
      called.push(data);
    },
    canShare(data) {
      assert.equal(this, navigator);
      return data.files.length === 1;
    },
    clipboard: {
      async writeText(text) {
        called.push(text);
      },
    },
  };
  const target = {
    navigator,
    File: class {
      constructor(parts, name, options) {
        Object.assign(this, { parts, name, type: options.type });
      }
    },
    open(url, where, flags) {
      called.push([url, where, flags]);
      return {};
    },
  };
  const ports = createSharePorts(target);
  assert.equal(ports.nativeShare.available, true);
  assert.equal(ports.nativeShare.supportsFiles({}), true);
  assert.equal(
    ports.nativeShare.makeFile({
      blob: new Blob(["x"], { type: "image/png" }),
      filename: "x.png",
    }).name,
    "x.png",
  );
  await ports.nativeShare.share({ text: "x" });
  await ports.clipboard.writeText("copy");
  ports.openExternal("https://example.test/");
  assert.deepEqual(called.at(-1), [
    "https://example.test/",
    "_blank",
    "noopener,noreferrer",
  ]);
  assert.throws(() => ports.openExternal("javascript:alert(1)"), /enlace/);
  const absent = createSharePorts({ navigator: {}, open: () => null });
  assert.equal(absent.nativeShare.available, false);
  assert.equal(absent.nativeShare.supportsFiles({}), false);
  await assert.rejects(() => absent.clipboard.writeText("x"), /portapapeles/);
  navigator.canShare = () => {
    throw Error("blocked");
  };
  assert.equal(ports.nativeShare.supportsFiles({}), false);
});

test("local event dates convert to instants rather than floating recipient times", () => {
  const iso = localMatchInstant("2026-12-31", "23:30");
  assert.ok(iso.endsWith("Z"));
  const actual = new Date(iso);
  assert.equal(actual.getFullYear(), 2026);
  assert.equal(actual.getMonth(), 11);
  assert.equal(actual.getDate(), 31);
  assert.equal(actual.getHours(), 23);
  assert.throws(() => localMatchInstant("2026-02-30", "20:00"), /Fecha/);
  assert.equal(nextFriday(new Date(2026, 8, 5, 23, 30)), "2026-09-11");
  assert.equal(nextFriday(new Date(2026, 8, 11, 23, 30)), "2026-09-18");
});

test("local timezone adapter rejects nonexistent DST wall times reproducibly", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    assert.throws(() => localMatchInstant("2026-03-08", "02:30"), /no existe/);
    assert.equal(
      localMatchInstant("2026-03-08", "03:30"),
      "2026-03-08T07:30:00.000Z",
    );
    process.env.TZ = "America/Montevideo";
    assert.equal(
      localMatchInstant("2026-12-31", "23:30"),
      "2027-01-01T02:30:00.000Z",
    );
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

import { performance } from "node:perf_hooks";

const target = process.argv[2] || process.env.FC_MONITOR_URL;
const attempts = 3;
const timeoutMs = 10_000;

if (!target) {
  console.error("Definí FC_MONITOR_URL o pasá la URL como argumento.");
  process.exit(2);
}

let url;
try {
  url = new URL(target);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error();
} catch (_) {
  console.error("FC_MONITOR_URL debe ser una URL http(s) válida.");
  process.exit(2);
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "futbolclub-availability-monitor/1.0" },
      redirect: "follow",
      signal: controller.signal,
    });
    const ttfbMs = Math.round(performance.now() - startedAt);
    const body = await response.text();
    const totalMs = Math.round(performance.now() - startedAt);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!body.includes("futbolClub"))
      throw new Error("La respuesta no contiene la marca esperada");
    console.log(
      JSON.stringify({
        status: "up",
        url: response.url,
        httpStatus: response.status,
        ttfbMs,
        totalMs,
        bytes: Buffer.byteLength(body),
        attempt,
        checkedAt: new Date().toISOString(),
      }),
    );
    clearTimeout(timer);
    process.exit(0);
  } catch (error) {
    clearTimeout(timer);
    lastError = error;
    console.error(
      JSON.stringify({
        status: "retrying",
        attempt,
        message: error.name === "AbortError" ? "timeout" : error.message,
      }),
    );
  }
}

console.error(
  JSON.stringify({
    status: "down",
    url: url.toString(),
    message: lastError?.message || "unknown error",
    checkedAt: new Date().toISOString(),
  }),
);
process.exit(1);

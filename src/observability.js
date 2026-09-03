(function initObservability() {
  const MAX_LOGS = 100;
  const STORAGE_KEY = "fc.observability.logs";
  const config = {
    endpoint: "",
    sampleRate: 1,
    heartbeatMs: 5 * 60 * 1000,
    ...(window.OBSERVABILITY_CONFIG || {}),
  };
  const release = window.FC_RELEASE || { version: "dev", commit: "local" };
  const sessionId = (() => {
    try {
      const existing = sessionStorage.getItem("fc.observability.session");
      if (existing) return existing;
      const created = crypto.randomUUID();
      sessionStorage.setItem("fc.observability.session", created);
      return created;
    } catch (_) {
      return `session-${Date.now()}`;
    }
  })();
  const logs = (() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]").slice(
        -MAX_LOGS,
      );
    } catch (_) {
      return [];
    }
  })();
  const vitals = {};

  function cleanRoute() {
    return `${location.pathname}${location.hash.startsWith("#share=") ? "#share" : location.hash}`;
  }

  function redact(value, depth = 0) {
    if (depth > 4) return "[truncated]";
    if (
      value == null ||
      typeof value === "boolean" ||
      typeof value === "number"
    )
      return value;
    if (typeof value === "string") return value.slice(0, 500);
    if (value instanceof Error)
      return {
        name: value.name,
        message: value.message.slice(0, 500),
        stack: value.stack?.slice(0, 2000),
      };
    if (value instanceof Element)
      return `${value.tagName.toLowerCase()}${value.id ? `#${value.id}` : ""}`;
    if (Array.isArray(value))
      return value.slice(0, 20).map((v) => redact(v, depth + 1));
    if (typeof value === "object") {
      const result = {};
      for (const [key, child] of Object.entries(value).slice(0, 30)) {
        if (/password|token|secret|authorization|cookie|email/i.test(key)) {
          result[key] = "[redacted]";
        } else {
          result[key] = redact(child, depth + 1);
        }
      }
      return result;
    }
    return String(value).slice(0, 500);
  }

  function persist() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(logs.slice(-MAX_LOGS)),
      );
    } catch (_) {}
  }

  function canSend() {
    if (!config.endpoint || Math.random() > Number(config.sampleRate || 0))
      return false;
    try {
      const endpoint = new URL(config.endpoint, location.origin);
      return (
        endpoint.origin === location.origin ||
        endpoint.hostname.endsWith(".supabase.co")
      );
    } catch (_) {
      return false;
    }
  }

  function send(entry) {
    if (!canSend()) return;
    const body = JSON.stringify(entry);
    if (
      navigator.sendBeacon?.(
        config.endpoint,
        new Blob([body], { type: "application/json" }),
      )
    )
      return;
    fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    }).catch(() => {});
  }

  function record(type, level, message, context = {}) {
    const entry = {
      type,
      level,
      message: String(message).slice(0, 500),
      context: redact(context),
      route: cleanRoute(),
      online: navigator.onLine,
      release,
      sessionId,
      at: new Date().toISOString(),
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
    persist();
    send(entry);
    window.dispatchEvent(
      new CustomEvent("fc:observability", { detail: entry }),
    );
    return entry;
  }

  function recordVital(metric) {
    const value = Number(metric.value.toFixed(metric.name === "CLS" ? 4 : 1));
    const detail = {
      name: metric.name,
      value,
      rating: metric.rating,
      delta: Number(metric.delta.toFixed(metric.name === "CLS" ? 4 : 1)),
      navigationType: metric.navigationType,
      attribution: redact(metric.attribution || {}),
    };
    vitals[metric.name] = detail;
    record("web-vital", "info", metric.name, detail);
    window.dispatchEvent(new CustomEvent("fc:web-vital", { detail }));
  }

  function diagnostics() {
    return {
      app: "futbolClub",
      generatedAt: new Date().toISOString(),
      release,
      route: cleanRoute(),
      online: navigator.onLine,
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight },
      vitals: { ...vitals },
      logs: [...logs],
    };
  }

  window.fcObservability = {
    log(level, message, context) {
      return record("log", level, message, context);
    },
    getLogs: () => [...logs],
    getVitals: () => ({ ...vitals }),
    diagnostics,
    downloadDiagnostics() {
      const blob = new Blob([JSON.stringify(diagnostics(), null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `futbolclub-diagnostico-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  };

  window.addEventListener("error", (event) =>
    record("error", "error", event.message || "Error no controlado", {
      filename: event.filename?.split("/").pop(),
      line: event.lineno,
      column: event.colno,
      error: event.error,
    }),
  );
  window.addEventListener("unhandledrejection", (event) =>
    record("error", "error", "Promesa rechazada sin manejar", {
      reason: event.reason,
    }),
  );
  window.addEventListener("online", () =>
    record("availability", "info", "online"),
  );
  window.addEventListener("offline", () =>
    record("availability", "warn", "offline"),
  );
  window.addEventListener("fc:ready", () =>
    record("availability", "info", "app-ready", {
      durationMs: Math.round(performance.now()),
    }),
  );

  if (window.webVitals) {
    const options = { reportAllChanges: true };
    window.webVitals.onLCP(recordVital, options);
    window.webVitals.onCLS(recordVital, options);
    window.webVitals.onINP(recordVital, options);
  } else {
    record("error", "warn", "web-vitals no está disponible");
  }

  const heartbeatMs = Math.max(60_000, Number(config.heartbeatMs) || 300_000);
  setInterval(() => {
    if (document.visibilityState === "visible")
      record("availability", "info", "heartbeat");
  }, heartbeatMs);
})();

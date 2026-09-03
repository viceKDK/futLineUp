const TWEAKS_KEY = "fc.v1.tweaks";
const TWEAKS_DEFAULT = {
  pitchStyle: "classic",
  playerStyle: "photo",
  accent: "lime",
};
try {
  const raw = localStorage.getItem(TWEAKS_KEY);
  window.__TWEAKS = raw
    ? { ...TWEAKS_DEFAULT, ...JSON.parse(raw) }
    : { ...TWEAKS_DEFAULT };
} catch (_) {
  window.__TWEAKS = { ...TWEAKS_DEFAULT };
}

const accentMap = {
  lime: "oklch(0.86 0.17 124)",
  cyan: "oklch(0.82 0.13 210)",
  red: "oklch(0.70 0.19 28)",
};
function applyTweaks(t) {
  document.documentElement.style.setProperty(
    "--accent",
    accentMap[t.accent] || accentMap.lime,
  );
  document.body.dataset.pitch = t.pitchStyle;
  document.body.dataset.playerStyle = t.playerStyle;
}
function saveTweaks() {
  try {
    localStorage.setItem(TWEAKS_KEY, JSON.stringify(window.__TWEAKS));
  } catch (_) {}
}
function setTweak(key, value) {
  window.__TWEAKS[key] = value;
  applyTweaks(window.__TWEAKS);
  saveTweaks();
  document
    .querySelectorAll(`.tweaks .seg[data-tweak="${key}"] button`)
    .forEach((b) => {
      const selected = b.dataset.v === value;
      b.classList.toggle("on", selected);
      b.setAttribute("aria-pressed", String(selected));
    });
  window.dispatchEvent(
    new CustomEvent("fc:tweak-changed", { detail: { key, value } }),
  );
}
window.fcSetTweak = setTweak;
window.fcGetTweaks = () => ({ ...window.__TWEAKS });
applyTweaks(window.__TWEAKS);

// Sync segmented buttons to stored values
document.querySelectorAll(".tweaks .seg").forEach((seg) => {
  const key = seg.dataset.tweak;
  seg.querySelectorAll("button").forEach((btn) => {
    const selected = btn.dataset.v === window.__TWEAKS[key];
    btn.classList.toggle("on", selected);
    btn.setAttribute("aria-pressed", String(selected));
  });
});

document.getElementById("tweaks-fab").addEventListener("click", () => {
  const open = document.getElementById("tweaks").classList.toggle("open");
  document
    .getElementById("tweaks-fab")
    .setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".tweaks .seg").forEach((seg) => {
  const key = seg.dataset.tweak;
  seg.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => setTweak(key, btn.dataset.v));
  });
});

const nav = document.getElementById("nav");
const sidebar = document.querySelector(".sidebar");
const mobileNavToggle = document.getElementById("mobile-nav-toggle");
mobileNavToggle.addEventListener("click", () => {
  const open = sidebar.classList.toggle("nav-open");
  mobileNavToggle.setAttribute("aria-expanded", String(open));
  mobileNavToggle.setAttribute(
    "aria-label",
    open ? "Cerrar menú de navegación" : "Abrir menú de navegación",
  );
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !sidebar.classList.contains("nav-open")) return;
  sidebar.classList.remove("nav-open");
  mobileNavToggle.setAttribute("aria-expanded", "false");
  mobileNavToggle.focus();
});
nav.addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-item");
  if (!btn) return;
  go(btn.dataset.page);
  sidebar.classList.remove("nav-open");
  mobileNavToggle.setAttribute("aria-expanded", "false");
});
function go(page, updateHistory = true) {
  if (!document.getElementById("page-" + page)) page = "home";
  document.querySelectorAll(".nav-item").forEach((b) => {
    const active = b.dataset.page === page;
    b.classList.toggle("active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.toggle("active", p.id === "page-" + page));
  document
    .querySelector(".app-shell")
    .classList.toggle("auth-mode", page === "auth");
  if (updateHistory && !location.hash.startsWith("#share="))
    history.pushState({ page }, "", `#${page}`);
  window.scrollTo({ top: 0 });
}
window.go = go;
window.addEventListener("popstate", (event) =>
  go(event.state?.page || location.hash.slice(1) || "home", false),
);
window.addEventListener("DOMContentLoaded", () => {
  let initial;
  if (location.hash.startsWith("#share=")) {
    initial = "share";
  } else if (location.hash) {
    initial = location.hash.slice(1);
  } else {
    let seenAuthIntro = false;
    try {
      seenAuthIntro = localStorage.getItem("fc.v1.authIntroSeen") === "1";
    } catch (_) {}
    initial = seenAuthIntro ? "home" : "auth";
  }
  go(initial, false);
});

let __toastTimer = null;
window.__toast = function (msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
};

window.addEventListener("fc:storage-error", () =>
  window.__toast?.("No se pudieron guardar los datos. Exportá un backup."),
);

window.__pwaInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  window.__pwaInstallPrompt = event;
  window.dispatchEvent(new CustomEvent("fc:pwa-installable"));
});
window.addEventListener("appinstalled", () => {
  window.__pwaInstallPrompt = null;
  window.dispatchEvent(new CustomEvent("fc:pwa-installed"));
  window.__toast?.("futbolClub quedó instalado");
});
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  const hadController = !!navigator.serviceWorker.controller;
  let updateReloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || updateReloading) return;
    document.getElementById("update-banner")?.classList.add("show");
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => navigator.serviceWorker.ready)
      .then(() => window.dispatchEvent(new CustomEvent("fc:pwa-ready")))
      .catch((error) =>
        console.warn("[futbolClub] No se pudo activar el modo offline", error),
      );
  });
  document
    .getElementById("update-banner-btn")
    ?.addEventListener("click", () => {
      updateReloading = true;
      location.reload();
    });
}

// Generated native entry for a classic deferred script tag.
import("../src/app/mount-share.js").catch((error) => {
  console.error("[futbolClub] No se pudo cargar un módulo", error);
  const root = document.getElementById("page-share");
  if (root) {
    root.setAttribute("role", "alert");
    root.textContent = "No se pudo abrir esta pantalla. Recargá la aplicación.";
  }
});

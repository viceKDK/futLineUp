/** Native sources can be reached from either an ESM tag or a classic deferred tag. */
export function nativeEntrySource(
  sourcePath,
  { moduleTag = false, targetId = "" } = {},
) {
  if (!/^src\/[\w/-]+\.js$/.test(sourcePath))
    throw new Error("Ruta de entrada inválida");
  const specifier = JSON.stringify(`../${sourcePath}`);
  if (moduleTag)
    return `// Generated native module entry.\nimport ${specifier};\n`;
  return `// Generated native entry for a classic deferred script tag.\nimport(${specifier}).catch((error) => {\n  console.error("[futbolClub] No se pudo cargar un módulo", error);\n  const root = document.getElementById(${JSON.stringify(targetId)});\n  if (root) {\n    root.setAttribute("role", "alert");\n    root.textContent = "No se pudo abrir esta pantalla. Recargá la aplicación.";\n  }\n});\n`;
}

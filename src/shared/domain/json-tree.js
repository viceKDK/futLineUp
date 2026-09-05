/** Validate untrusted JSON before it reaches persistence or rendering. */
export function validateJsonTree(value, limits = {}) {
  const { maxNodes = 50000, maxDepth = 12, maxString = 250000, maxArray = 5000, maxProperties = 1000 } = limits;
  let nodes = 0;
  function visit(current, depth) {
    if (++nodes > maxNodes)
      throw new Error("El backup contiene demasiados datos");
    if (depth > maxDepth)
      throw new Error("El backup tiene una estructura demasiado profunda");
    if (current === null || typeof current === "boolean")
      return;
    if (typeof current === "number") {
      if (!Number.isFinite(current))
        throw new Error("El backup contiene números inválidos");
      return;
    }
    if (typeof current === "string") {
      if (current.length > maxString)
        throw new Error("El backup contiene un texto o imagen demasiado grande");
      return;
    }
    if (Array.isArray(current)) {
      if (current.length > maxArray)
        throw new Error("El backup contiene listas demasiado grandes");
      for (const child of current)
        visit(child, depth + 1);
      return;
    }
    if (typeof current !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(current))) {
      throw new Error("El backup contiene valores no admitidos");
    }
    const entries = Object.entries(current);
    if (entries.length > maxProperties)
      throw new Error("El backup contiene objetos demasiado grandes");
    for (const [key, child] of entries) {
      if (["__proto__", "prototype", "constructor"].includes(key))
        throw new Error("El backup contiene claves no admitidas");
      visit(child, depth + 1);
    }
  }
  visit(value, 0);
}

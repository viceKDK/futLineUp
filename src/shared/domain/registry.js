/** Explicit extension point. Duplicate registrations never silently override policy. */
export function createRegistry(defaults, extensions = {}) {
  const registry = new Map(Object.entries(defaults));
  for (const [name, handler] of Object.entries(extensions)) {
    if (registry.has(name))
      throw new Error(`Ya está registrado: ${name}`);
    if (["__proto__", "constructor", "prototype"].includes(name) || typeof handler !== "function") {
      throw new TypeError(`La extensión ${name} debe ser una función con nombre válido`);
    }
    registry.set(name, handler);
  }
  return Object.freeze({
    has: (name) => registry.has(name),
    get: (name) => registry.get(name),
    keys: () => [...registry.keys()],
  });
}

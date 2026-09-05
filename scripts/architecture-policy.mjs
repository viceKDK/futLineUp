import { SourceTextModule } from "node:vm";
import { posix } from "node:path";
const allowed = {
  domain: new Set(["domain"]),
  application: new Set(["domain", "application"]),
  infrastructure: new Set(["domain", "application", "infrastructure"]),
  presentation: new Set(["domain", "application", "presentation"]),
  app: new Set(["domain", "application", "infrastructure", "presentation", "app"]),
};
const layerOf = (file) => file.startsWith("src/app/") ? "app" : file.split("/").find((part) => Object.hasOwn(allowed, part));
/** Parse actual ES modules; comments and string literals cannot fake an import. */
export function inspectArchitecture(sources) {
  const errors = [];
  const graph = new Map();
  for (const [file, source] of sources) {
    const layer = layerOf(file);
    if (!layer) {
      errors.push(`${file}: falta una capa explícita`);
      continue;
    }
    const parsed = new SourceTextModule(source, { identifier: file });
    const dependencies = [];
    for (const specifier of parsed.dependencySpecifiers) {
      if (!specifier.startsWith(".")) {
        errors.push(`${file}: dependencia externa ${specifier}`);
        continue;
      }
      const target = posix.normalize(posix.join(posix.dirname(file), specifier));
      dependencies.push(target);
      if (!sources.has(target))
        errors.push(`${file}: módulo inexistente ${target}`);
      else if (!allowed[layer].has(layerOf(target)))
        errors.push(`${file}: ${layer} no puede depender de ${layerOf(target)}`);
      if (file.startsWith("src/shared/") && target.startsWith("src/features/"))
        errors.push(`${file}: shared no puede depender de features`);
    }
    graph.set(file, dependencies);
  }
  const visited = new Set(), visiting = new Set();
  function visit(file, path) {
    if (visiting.has(file)) {
      errors.push(`Dependencia circular: ${[...path, file].join(" -> ")}`);
      return;
    }
    if (visited.has(file))
      return;
    visiting.add(file);
    for (const dependency of graph.get(file) || [])
      visit(dependency, [...path, file]);
    visiting.delete(file);
    visited.add(file);
  }
  for (const file of graph.keys())
    visit(file, []);
  return errors;
}

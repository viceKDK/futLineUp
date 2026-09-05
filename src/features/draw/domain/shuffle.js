/** Fisher-Yates. Inject a seeded/random source for reproducible tests or draws. */
export function fisherYates(items, random = Math.random) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1)
      throw new RangeError("La fuente aleatoria debe devolver un valor en [0, 1)");
    const j = Math.floor(value * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

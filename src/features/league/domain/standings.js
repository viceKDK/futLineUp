export const DEFAULT_POINTS = Object.freeze({ win: 3, draw: 1, loss: 0 });

function finiteScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0) throw new Error("Resultado inválido");
  return score;
}

export function validatePlayedFixture(fixture) {
  if (!fixture || !fixture.played) return null;
  const home = String(fixture.home || "").trim();
  const away = String(fixture.away || "").trim();
  if (!home || !away || home.toLocaleLowerCase() === away.toLocaleLowerCase()) throw new Error("Partido inválido");
  return { ...fixture, home, away, homeScore: finiteScore(fixture.homeScore), awayScore: finiteScore(fixture.awayScore) };
}

export function calculateStandings(fixtures, { points = DEFAULT_POINTS, tieBreakers } = {}) {
  const table = new Map();
  const row = (name) => {
    if (!table.has(name)) table.set(name, { name, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0, form: [] });
    return table.get(name);
  };
  const played = fixtures.filter((fixture) => fixture?.played).map(validatePlayedFixture)
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  for (const fixture of played) {
    const home = row(fixture.home), away = row(fixture.away), hs = fixture.homeScore, as = fixture.awayScore;
    home.pj += 1; away.pj += 1; home.gf += hs; home.gc += as; away.gf += as; away.gc += hs;
    if (hs > as) {
      home.pg += 1; away.pp += 1; home.pts += points.win; away.pts += points.loss; home.form.push("G"); away.form.push("P");
    } else if (hs < as) {
      away.pg += 1; home.pp += 1; away.pts += points.win; home.pts += points.loss; home.form.push("P"); away.form.push("G");
    } else {
      home.pe += 1; away.pe += 1; home.pts += points.draw; away.pts += points.draw; home.form.push("E"); away.form.push("E");
    }
  }
  const rules = tieBreakers || [
    (a, b) => b.pts - a.pts,
    (a, b) => (b.gf - b.gc) - (a.gf - a.gc),
    (a, b) => b.gf - a.gf,
    (a, b) => a.name.localeCompare(b.name),
  ];
  return [...table.values()].sort((a, b) => {
    for (const rule of rules) { const result = rule(a, b); if (result) return result; }
    return 0;
  }).map((team) => ({ ...team, form: team.form.slice(-5) }));
}

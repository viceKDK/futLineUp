// Utilidades compartidas por los specs de screenshots (desktop y mobile).

// La sidebar usa position:sticky (para quedar fija al scrollear en la app real).
// El captureScreenshot con fullPage:true de Chromium arma la imagen a los tirones
// (scroll + stitch), y los elementos sticky no se componen bien ahí — queda un
// hueco en blanco arriba de la sidebar. Workaround: agrandamos el viewport a la
// altura real del contenido y sacamos una captura normal (sin scroll de por medio).
export async function shootFull(page, path) {
  const height = await page.evaluate(() => Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)));
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: viewport.width, height });
  await page.screenshot({ path });
  await page.setViewportSize(viewport);
}

// Datos de demo realistas para que las capturas de Entrenador y Liga amateur
// no queden vacías (fresh guest state por defecto).
export async function seedDemoData(page) {
  await page.evaluate(() => {
    const roster = window.db.load('roster', window.DEFAULT_ROSTER).slice(0, 9).map((p, i) => ({
      ...p,
      attrs: { tech: 5 + (i % 5), phys: 6 + (i % 3), tac: 4 + (i % 4), fin: 5 + (i % 5), att: 7 },
    }));
    window.db.save('roster', roster);

    const sessions = [];
    const attendance = {};
    const today = new Date();
    for (let i = 10; i >= 1; i--) {
      const d = new Date(today.getTime() - i * 3 * 86400000);
      const id = 'tr' + i;
      sessions.push({ id, title: i % 3 === 0 ? 'Partido amistoso' : 'Entrenamiento', date: d.toISOString().slice(0, 10) });
      attendance[id] = roster.filter((_, idx) => (idx + i) % 4 !== 0).map(p => p.id);
    }
    window.db.save('trainingSessions', sessions);
    window.db.save('attendance', attendance);

    const evaluations = [];
    roster.forEach((p, pi) => {
      for (let i = 0; i < 5; i++) {
        const d = new Date(today.getTime() - (25 - i * 5) * 86400000);
        evaluations.push({
          id: `ev${p.id}-${i}`, playerId: p.id, date: d.toISOString().slice(0, 10),
          rating: 5 + ((i + pi) % 5), good: 'Buen desempeño en el mediocampo',
          improve: 'Mejorar definición de espaldas al arco', goal: 'Sumar minutos de rodaje',
          context: i % 2 ? 'match' : 'training',
        });
      }
    });
    window.db.save('evaluations', evaluations);

    window.db.save('objectives', [
      { id: 'ob1', playerId: roster[0].id, text: 'Sumar 2 goles en julio', done: true },
      { id: 'ob2', playerId: roster[0].id, text: 'Asistencia sobre 80%', done: true },
      { id: 'ob3', playerId: roster[0].id, text: 'Mejorar definición pierna izquierda', done: false },
    ]);

    const teams = ['Los Pibes FC', 'Deportivo Norte', 'La Amistad', 'Atlético Barrio', 'Racing de Acá'];
    const fixtures = [];
    let fid = 1;
    for (let round = 0; round < 4; round++) {
      for (let i = 0; i < teams.length - 1; i += 2) {
        const d = new Date(today.getTime() - (4 - round) * 7 * 86400000);
        fixtures.push({
          id: 'fx' + (fid++), date: d.toISOString().slice(0, 10), home: teams[i], away: teams[i + 1],
          played: true, homeScore: (fid * 7) % 4, awayScore: (fid * 5) % 4,
        });
      }
    }
    fixtures.push({
      id: 'fx' + (fid++), date: new Date(today.getTime() + 5 * 86400000).toISOString().slice(0, 10),
      home: teams[0], away: teams[1], played: false, homeScore: 0, awayScore: 0,
    });
    window.db.save('league', { name: 'Liga de los sábados', season: '2026 · Apertura', fixtures });
  });
}

export async function openSeededApp(page) {
  await page.route('**/src/local-config.js', route => route.fulfill({ body:'window.RESET_ON_BOOT=false;', contentType:'text/javascript' }));
  await page.goto('/futbolClub.html');
  await page.waitForSelector('.nav-item');
  await page.waitForFunction(() => !!window.db);
  await seedDemoData(page);
  await page.reload();
  await page.waitForSelector('.nav-item');
}

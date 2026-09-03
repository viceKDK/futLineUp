import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/src/local-config.js", (route) =>
    route.fulfill({
      body: "window.RESET_ON_BOOT=false;",
      contentType: "text/javascript",
    }),
  );
  await page.goto("/futbolClub.html#home");
  await page.waitForFunction(() => window.__FC_READY__ === true);
});

test("genera todos contra todos en ida e ida/vuelta", async ({ page }) => {
  const result = await page.evaluate(() => {
    const teams = ["A", "B", "C", "D"];
    const single = window.generateLeagueRoundRobin(teams, {
      doubleRound: false,
      startDate: "2026-09-01",
      daysBetween: 7,
    });
    const double = window.generateLeagueRoundRobin(teams, {
      doubleRound: true,
      startDate: "2026-09-01",
      daysBetween: 7,
    });
    const singlePairs = single.map((fixture) =>
      [fixture.home, fixture.away].sort().join("|")
    );
    const directedPairs = double.map((fixture) =>
      `${fixture.home}>${fixture.away}`
    );
    return {
      singleCount: single.length,
      doubleCount: double.length,
      uniqueSinglePairs: new Set(singlePairs).size,
      uniqueDirectedPairs: new Set(directedPairs).size,
      firstDate: double[0].date,
      lastDate: double.at(-1).date,
      rounds: Math.max(...double.map((fixture) => fixture.round)),
    };
  });

  expect(result.singleCount).toBe(6);
  expect(result.doubleCount).toBe(12);
  expect(result.uniqueSinglePairs).toBe(6);
  expect(result.uniqueDirectedPairs).toBe(12);
  expect(result.firstDate).toBe("2026-09-01");
  expect(result.lastDate).toBe("2026-10-06");
  expect(result.rounds).toBe(6);
});

test("con cantidad impar deja un equipo libre por fecha", async ({ page }) => {
  const result = await page.evaluate(() => {
    const fixtures = window.generateLeagueRoundRobin(["A", "B", "C", "D", "E"], {
      startDate: "2026-09-01",
      daysBetween: 7,
    });
    const byRound = {};
    fixtures.forEach((fixture) => {
      (byRound[fixture.round] ||= []).push(fixture);
    });
    return {
      count: fixtures.length,
      rounds: Object.keys(byRound).length,
      matchesPerRound: Object.values(byRound).map((matches) => matches.length),
    };
  });

  expect(result.count).toBe(10);
  expect(result.rounds).toBe(5);
  expect(result.matchesPerRound).toEqual([2, 2, 2, 2, 2]);
});

test("CSV exportado puede volver a importarse con resultados", async ({ page }) => {
  const result = await page.evaluate(() => {
    const competition = {
      name: "Apertura",
      teams: ["Los Pibes", "La Banda", "El Barrio"],
      fixtures: [
        {
          id: "1",
          round: 1,
          leg: 1,
          date: "2026-09-01",
          home: "Los Pibes",
          away: "La Banda",
          homeScore: 2,
          awayScore: 1,
          played: true,
        },
        {
          id: "2",
          round: 2,
          leg: 1,
          date: "2026-09-08",
          home: "El Barrio",
          away: "Los Pibes",
          homeScore: 0,
          awayScore: 0,
          played: false,
        },
      ],
    };
    const fixtureCsv = window.leagueFixtureCsv(competition);
    const teamsCsv = window.leagueTeamsCsv(competition);
    const reparsedFixture = window.parseLeagueCsv(fixtureCsv);
    const reparsedTeams = window.parseLeagueCsv(teamsCsv);
    return {
      fixtureCsv,
      teamsCsv,
      fixtureCount: reparsedFixture.fixtures.length,
      teamCount: reparsedTeams.teams.length,
      firstPlayed: reparsedFixture.fixtures[0].played,
      firstScore: [
        reparsedFixture.fixtures[0].homeScore,
        reparsedFixture.fixtures[0].awayScore,
      ],
      secondPlayed: reparsedFixture.fixtures[1].played,
    };
  });

  expect(result.fixtureCsv).toContain("Ronda,Ida/Vuelta,Fecha,Local,Visitante");
  expect(result.fixtureCsv).toContain("Los Pibes,La Banda,2,1");
  expect(result.teamsCsv).toContain("Equipo\nLos Pibes\nLa Banda\nEl Barrio");
  expect(result.fixtureCount).toBe(2);
  expect(result.teamCount).toBe(3);
  expect(result.firstPlayed).toBe(true);
  expect(result.firstScore).toEqual([2, 1]);
  expect(result.secondPlayed).toBe(false);
});

test("flujo UI genera fixture ida/vuelta y lo guarda en la liga", async ({ page }) => {
  await page.click('[data-page="league"]');
  await page.locator(".league-setup-fields input").first().fill("Liga fixture test");

  const teamInput = page.getByLabel("Nombre del equipo");
  for (const team of ["A", "B", "C", "D"]) {
    await teamInput.fill(team);
    await page.getByRole("button", { name: "Agregar" }).click();
  }
  await page.getByRole("button", { name: "Crear liga" }).click();

  await page.getByRole("button", { name: "Generar fixture" }).click();
  await page.getByRole("button", { name: "Ida y vuelta" }).click();
  await page.getByLabel("Primera fecha").fill("2026-09-01");
  await page.getByLabel("Días entre fechas").fill("7");
  await page.getByRole("button", { name: "Generar 12 partidos" }).click();

  const stored = await page.evaluate(() => {
    const competitions = window.db.load("competitions", []);
    const activeId = window.db.load("activeCompetitionId", "");
    const competition = competitions.find((item) => item.id === activeId);
    return {
      count: competition.fixtures.length,
      first: competition.fixtures[0],
      last: competition.fixtures.at(-1),
    };
  });

  expect(stored.count).toBe(12);
  expect(stored.first.date).toBe("2026-09-01");
  expect(stored.last.leg).toBe(2);
  await expect(page.getByRole("button", { name: "Fixture CSV ↓" })).toBeVisible();
});

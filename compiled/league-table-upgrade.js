(function () {
  if (typeof window.calculateStandings !== "function") return;
  function emptyRow(name) {
    return {
      name,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      pts: 0,
      form: []
    };
  }
  function getActiveCompetition() {
    const competitions = window.db?.load?.("competitions", []) || [];
    const activeId = window.db?.load?.("activeCompetitionId", "") || "";
    return competitions.find(competition => competition.id === activeId) || competitions[0] || null;
  }
  function getTeamNames(fixtures) {
    const teamNames = new Set();
    const activeCompetition = getActiveCompetition();
    const explicitTeams = Array.isArray(activeCompetition?.teams) ? activeCompetition.teams : [];
    const add = team => {
      const name = (typeof team === "string" ? team : team?.name || "").trim();
      if (name) teamNames.add(name);
    };
    if (explicitTeams.length) {
      explicitTeams.forEach(add);
    } else {
      const savedTeams = window.db?.load?.("teams", window.DEFAULT_SAVED_TEAMS || []) || [];
      savedTeams.forEach(add);
    }
    fixtures.forEach(fixture => {
      add(fixture?.home);
      add(fixture?.away);
    });
    return teamNames;
  }
  function buildStandings(fixtures, teamNames) {
    const table = new Map([...teamNames].map(name => [name, emptyRow(name)]));
    const row = name => {
      const cleanName = (name || "").trim();
      if (!cleanName) return null;
      if (!table.has(cleanName)) table.set(cleanName, emptyRow(cleanName));
      return table.get(cleanName);
    };
    fixtures.filter(fixture => fixture?.played).slice().sort((a, b) => (a.date || "").localeCompare(b.date || "")).forEach(fixture => {
      const home = row(fixture.home);
      const away = row(fixture.away);
      if (!home || !away) return;
      const homeScore = Number(fixture.homeScore);
      const awayScore = Number(fixture.awayScore);
      if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return;
      home.pj += 1;
      away.pj += 1;
      home.gf += homeScore;
      home.gc += awayScore;
      away.gf += awayScore;
      away.gc += homeScore;
      if (homeScore > awayScore) {
        home.pg += 1;
        away.pp += 1;
        home.pts += 3;
        home.form.push("G");
        away.form.push("P");
      } else if (homeScore < awayScore) {
        away.pg += 1;
        home.pp += 1;
        away.pts += 3;
        home.form.push("P");
        away.form.push("G");
      } else {
        home.pe += 1;
        away.pe += 1;
        home.pts += 1;
        away.pts += 1;
        home.form.push("E");
        away.form.push("E");
      }
    });
    return [...table.values()].sort((a, b) => b.pts - a.pts || b.gf - b.gc - (a.gf - a.gc) || b.gf - a.gf || a.name.localeCompare(b.name)).map(team => ({
      ...team,
      form: team.form.slice(-5)
    }));
  }
  window.calculateStandings = function calculateStandingsWithZeroTeams(fixtures) {
    const safeFixtures = Array.isArray(fixtures) ? fixtures : [];
    const teamNames = getTeamNames(safeFixtures);
    const current = buildStandings(safeFixtures, teamNames);
    const played = safeFixtures.filter(fixture => fixture?.played);
    let previous = current;
    if (played.length) {
      const latestPlayed = played.map((fixture, index) => ({
        fixture,
        index
      })).sort((a, b) => (b.fixture.date || "").localeCompare(a.fixture.date || "") || b.index - a.index)[0]?.fixture;
      let skipped = false;
      const previousFixtures = safeFixtures.filter(fixture => {
        if (!skipped && fixture === latestPlayed) {
          skipped = true;
          return false;
        }
        return true;
      });
      previous = buildStandings(previousFixtures, teamNames);
    }
    const previousPosition = new Map(previous.map((team, index) => [team.name, index + 1]));
    window.__leagueStandingsMovement = Object.fromEntries(current.map((team, index) => {
      const oldPosition = previousPosition.get(team.name) || index + 1;
      return [team.name, oldPosition - (index + 1)];
    }));
    return current;
  };
  function decorateMovement() {
    const movement = window.__leagueStandingsMovement || {};
    document.querySelectorAll("#page-league table.standings tbody tr").forEach(row => {
      const name = row.querySelector(".standings-team strong")?.textContent?.trim();
      const cell = row.querySelector("td:first-child");
      if (!name || !cell) return;
      const value = Number(movement[name] || 0);
      let marker = cell.querySelector(".position-move");
      if (!value) {
        marker?.remove();
        return;
      }
      if (!marker) {
        marker = document.createElement("span");
        marker.className = "position-move";
        cell.appendChild(marker);
      }
      marker.classList.toggle("up", value > 0);
      marker.classList.toggle("down", value < 0);
      marker.textContent = value > 0 ? `↑${value}` : `↓${Math.abs(value)}`;
      marker.title = value > 0 ? `Subió ${value} posición${value === 1 ? "" : "es"}` : `Bajó ${Math.abs(value)} posición${Math.abs(value) === 1 ? "" : "es"}`;
    });
  }
  const leagueRoot = document.getElementById("page-league");
  if (leagueRoot && "MutationObserver" in window) {
    new MutationObserver(decorateMovement).observe(leagueRoot, {
      childList: true,
      subtree: true
    });
  }
})();
//# sourceURL=src/league-table-upgrade.jsx

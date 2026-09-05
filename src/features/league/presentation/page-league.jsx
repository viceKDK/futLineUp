function LeaguePage() {
  const L = window.fcLeague;
  const [competitions, setCompetitions] = window.useStore("competitions", () => {
    const legacy = window.db.load("league", null);
    return [legacy ? { id: "c1", ...legacy } : { id: "c1", name: "Liga amateur", season: "2026", teams: [], fixtures: [], cup: null }];
  });
  const [activeId, setActiveId] = window.useStore("activeCompetitionId", () => competitions[0]?.id || "c1");
  const [tab, setTab] = React.useState("table");
  const [form, setForm] = React.useState({ date: new Date().toISOString().slice(0, 10), home: "", away: "", homeScore: "", awayScore: "" });
  const [scoreDrafts, setScoreDrafts] = React.useState({});
  const [dateFilter, setDateFilter] = React.useState({ from: "", to: "" });
  const competition = competitions.find((item) => item.id === activeId) || competitions[0];
  if (!competition) return <div className="empty-state">Creá una liga para empezar.</div>;
  const fixtures = competition.fixtures || [];
  const teams = L.inferTeams(competition);
  const standings = L.calculateStandings(fixtures);
  const updateCompetition = (producer) => setCompetitions((list) => list.map((item) => item.id === competition.id ? producer(item) : item));

  const saveFixture = () => {
    try {
      const fixture = L.validateFixtureDraft(form);
      updateCompetition((current) => ({ ...current, teams: L.normalizeTeamNames([...(current.teams || []), fixture.home, fixture.away]), fixtures: [...(current.fixtures || []), { id: `fx${Date.now()}`, ...fixture }] }));
      setForm((current) => ({ ...current, home: "", away: "", homeScore: "", awayScore: "" }));
      window.__toast?.("Partido agregado");
    } catch (error) { window.__toast?.(error.message); }
  };
  const saveScore = (fixture) => {
    const draft = scoreDrafts[fixture.id] || {};
    try {
      const validated = L.validateFixtureDraft({ ...fixture, homeScore: draft.home ?? fixture.homeScore, awayScore: draft.away ?? fixture.awayScore });
      updateCompetition((current) => ({ ...current, fixtures: (current.fixtures || []).map((item) => item.id === fixture.id ? { ...item, ...validated } : item) }));
      window.__toast?.("Resultado guardado");
    } catch (error) { window.__toast?.(error.message); }
  };
  const removeFixture = (id) => {
    if (!confirm("¿Eliminar este partido?")) return;
    updateCompetition((current) => ({ ...current, fixtures: (current.fixtures || []).filter((item) => item.id !== id) }));
  };
  const generateFixture = () => {
    try {
      const generated = L.createRoundRobin(teams, { startDate: form.date || new Date().toISOString().slice(0, 10) });
      if (fixtures.length && !confirm("Esto reemplazará el fixture actual. ¿Continuar?")) return;
      updateCompetition((current) => ({ ...current, fixtures: generated }));
      window.__toast?.("Fixture generado");
    } catch (error) { window.__toast?.(error.message); }
  };
  const createCup = () => {
    try {
      const cup = L.createCup(teams, { shuffle: true, randomize: window.fisherYates });
      updateCompetition((current) => ({ ...current, cup }));
    } catch (error) { window.__toast?.(error.message); }
  };

  const fixturesInRange = fixtures.filter((fixture) => (!dateFilter.from || fixture.date >= dateFilter.from) && (!dateFilter.to || fixture.date <= dateFilter.to));
  const byDate = Object.groupBy ? Object.groupBy(fixturesInRange.slice().sort((a,b)=>a.date.localeCompare(b.date)), (fixture)=>fixture.date || "Sin fecha") : fixturesInRange.reduce((groups,fixture)=>{const key=fixture.date||"Sin fecha";(groups[key] ||= []).push(fixture);return groups;},{});

  return <div>
    <div className="page-head"><div><div className="page-kicker">Modo liga</div><input className="editor-title-input" value={competition.name} onChange={(event)=>updateCompetition((current)=>({...current,name:event.target.value}))}/><div className="page-sub">{competition.season || "Temporada"} · {teams.length} equipos · {fixtures.length} partidos</div></div><div className="seg">{competitions.map((item)=><button key={item.id} className={item.id===competition.id?"on":""} onClick={()=>setActiveId(item.id)}>{item.name}</button>)}</div></div>
    <div className="seg league-tabs">{[["table","Tabla"],["fixture","Fixture"],["calendar","Calendario"],["cup","Copa"]].map(([id,label])=><button key={id} className={tab===id?"on":""} onClick={()=>setTab(id)}>{label}</button>)}</div>

    {tab==="table"&&<section className="card"><div className="panel-head-row"><span>Tabla de posiciones</span><span className="muted-note">{fixtures.filter((item)=>item.played).length} jugados</span></div>{standings.length?<div className="league-table"><div className="league-row header"><span>#</span><span>Equipo</span><span>PJ</span><span>G</span><span>E</span><span>P</span><span>GF</span><span>GC</span><span>DG</span><span>Pts</span></div>{standings.map((team,index)=><div className="league-row" key={team.name}><span>{index+1}</span><strong>{team.name}</strong><span>{team.pj}</span><span>{team.pg}</span><span>{team.pe}</span><span>{team.pp}</span><span>{team.gf}</span><span>{team.gc}</span><span>{team.gf-team.gc}</span><b>{team.pts}</b></div>)}</div>:<div className="empty-state">Cargá resultados para generar la tabla.</div>}</section>}

    {tab==="fixture"&&<div className="league-fixture-layout">
      <section className="card"><div className="panel-head-row"><span>Nuevo partido</span><button className="btn sm" onClick={generateFixture}>Generar round-robin</button></div><div className="form-grid-wide"><label className="field"><span>Fecha</span><input type="date" value={form.date} onChange={(event)=>setForm((current)=>({...current,date:event.target.value}))}/></label><label className="field"><span>Local</span><input list="league-team-names" value={form.home} onChange={(event)=>setForm((current)=>({...current,home:event.target.value}))}/></label><label className="field"><span>Visitante</span><input list="league-team-names" value={form.away} onChange={(event)=>setForm((current)=>({...current,away:event.target.value}))}/></label><label className="field"><span>Goles local</span><input type="number" min="0" value={form.homeScore} onChange={(event)=>setForm((current)=>({...current,homeScore:event.target.value}))}/></label><label className="field"><span>Goles visita</span><input type="number" min="0" value={form.awayScore} onChange={(event)=>setForm((current)=>({...current,awayScore:event.target.value}))}/></label></div><datalist id="league-team-names">{teams.map((team)=><option key={team} value={team}/>)}</datalist><button className="btn primary" onClick={saveFixture}>Agregar partido</button></section>
      <section className="card"><div className="panel-head-row"><span>Partidos</span><span className="muted-note">{fixtures.length}</span></div><div className="fixture-list">{fixtures.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).map((fixture)=><div className="fixture-row" key={fixture.id}><span className="fixture-date">{fixture.date||"s/f"}</span><strong>{fixture.home}</strong><input className="score-input" type="number" min="0" value={scoreDrafts[fixture.id]?.home ?? (fixture.played?fixture.homeScore:"")} onChange={(event)=>setScoreDrafts((current)=>({...current,[fixture.id]:{...(current[fixture.id]||{}),home:event.target.value}}))}/><span>–</span><input className="score-input" type="number" min="0" value={scoreDrafts[fixture.id]?.away ?? (fixture.played?fixture.awayScore:"")} onChange={(event)=>setScoreDrafts((current)=>({...current,[fixture.id]:{...(current[fixture.id]||{}),away:event.target.value}}))}/><strong>{fixture.away}</strong><button className="btn sm" onClick={()=>saveScore(fixture)}>Guardar</button><button className="btn sm ghost" onClick={()=>removeFixture(fixture.id)}>×</button></div>)}{!fixtures.length&&<div className="empty-state">Todavía no hay partidos.</div>}</div></section>
    </div>}

    {tab==="calendar"&&<section className="card"><div className="panel-head-row"><span>Calendario</span><div style={{display:"flex",gap:8}}><input type="date" value={dateFilter.from} onChange={(event)=>setDateFilter((current)=>({...current,from:event.target.value}))}/><input type="date" value={dateFilter.to} onChange={(event)=>setDateFilter((current)=>({...current,to:event.target.value}))}/></div></div>{Object.entries(byDate).map(([date,list])=><div className="calendar-day" key={date}><div className="calendar-date">{date}</div>{list.map((fixture)=><div key={fixture.id} className="calendar-fixture"><span>{fixture.home}</span><strong>{fixture.played?`${fixture.homeScore} – ${fixture.awayScore}`:"vs"}</strong><span>{fixture.away}</span></div>)}</div>)}{!fixturesInRange.length&&<div className="empty-state">No hay partidos en este rango.</div>}</section>}

    {tab==="cup"&&<LeagueCupView competition={competition} updateCompetition={updateCompetition} onCreate={createCup}/>} 
  </div>;
}

function LeagueCupView({competition,updateCompetition,onCreate}){
  const L=window.fcLeague;
  const cup=competition.cup;
  if(!cup) return <section className="card"><div className="panel-head-row"><span>Copa eliminatoria</span></div><p className="muted">Usa los participantes de esta competencia. Se admiten 4, 8, 16 o 32 equipos.</p><button className="btn primary" onClick={onCreate}>Crear cuadro</button></section>;
  const rounds=L.buildCupRounds(cup);
  const patch=(key,value)=>updateCompetition((current)=>({...current,cup:L.updateCupMatch(current.cup,key,value)}));
  return <section className="card"><div className="panel-head-row"><span>Copa · {cup.size} equipos</span><button className="btn sm ghost" onClick={onCreate}>Recrear</button></div><div className="cup-bracket">{rounds.map((round,roundIndex)=><div className="cup-round" key={roundIndex}><h3>{L.cupRoundLabel(roundIndex,rounds.length)}</h3>{round.map((entry)=><div className="cup-match" key={entry.key}><div className="cup-team"><span>{entry.teamA||"Por definir"}</span><input type="number" min="0" value={entry.match.scoreA??""} onChange={(event)=>patch(entry.key,{scoreA:event.target.value})}/></div><div className="cup-team"><span>{entry.teamB||"Por definir"}</span><input type="number" min="0" value={entry.match.scoreB??""} onChange={(event)=>patch(entry.key,{scoreB:event.target.value})}/></div>{entry.match.scoreA!==""&&entry.match.scoreA===entry.match.scoreB&&<div className="cup-penalties"><span>Penales</span><input type="number" min="0" value={entry.match.penA??""} onChange={(event)=>patch(entry.key,{penA:event.target.value})}/><input type="number" min="0" value={entry.match.penB??""} onChange={(event)=>patch(entry.key,{penB:event.target.value})}/></div>}</div>)}</div>)}</div></section>;
}

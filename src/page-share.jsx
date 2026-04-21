// Compartir / exportar — PNG/PDF/ICS reales, deep-links a redes, include toggles funcionales
function SharePage() {
  const [styleTab, setStyleTab] = React.useState("card");
  const [roster] = window.useStore('roster', window.DEFAULT_ROSTER);
  const [draft]  = window.useStore('editor', {
    name: "Los Pibes del Viernes",
    mode: 7, formIdx: 0,
    kit: { design: "stripes", primary: "#3b82f6", secondary: "#ffffff" },
    assignedIds: [],
    freePositions: {},
  });
  const [currentKit] = window.useStore('currentKit', null);

  // Match info (persistido, editable acá)
  const defaultDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7)); // próximo viernes
    return d.toISOString().slice(0,10);
  })();
  const [match, setMatch] = window.useStore('matchInfo', {
    date: defaultDate,
    time: "21:30",
    venue: "Canchita Palermo",
    opponent: "Rival",
    myScore: null, theirScore: null,
  });

  // Include toggles
  const [include, setInclude] = window.useStore('shareInclude', {
    names: true, kit: true, venue: true, stats: false, watermark: true,
  });
  const tog = (k) => setInclude(i => ({ ...i, [k]: !i[k] }));

  const mode = draft.mode || 7;
  const formIdx = draft.formIdx || 0;
  const formation = window.FORMATIONS[mode][formIdx];
  const size = formation.positions.length;
  const kit = draft.kit || currentKit || { design: "stripes", primary: "#3b82f6", secondary: "#ffffff" };
  const freeKey = `${mode}:${formIdx}`;
  const overrides = draft.freePositions?.[freeKey] || null;

  const ids = draft.assignedIds || [];
  const players = [];
  for (let i=0; i<size; i++) {
    const id = ids[i];
    const p = id != null ? roster.find(x => x.id === id) : null;
    players.push(p || roster[i] || null);
  }
  const captain = players.find(Boolean)?.name || "—";

  const slug = (draft.name || 'equipo').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const shareURL = `${location.origin}${location.pathname}#${slug}`;
  const shareText = `Alineación ${draft.name} (${formation.name}) · ${match.date} ${match.time} · ${match.venue}`;

  // --- Refs for capture ---
  const cardRef = React.useRef(null);

  // --- Actions ---
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      window.__toast?.('Link copiado');
    } catch (_) { window.__toast?.('No pude copiar'); }
  };

  const waitForLib = (key) => new Promise((res) => {
    if (window[key]) return res(window[key]);
    let tries = 0;
    const iv = setInterval(() => {
      if (window[key] || tries++ > 30) { clearInterval(iv); res(window[key]); }
    }, 100);
  });

  const captureCanvas = async () => {
    const h2c = await waitForLib('html2canvas');
    if (!h2c || !cardRef.current) throw new Error('export no disponible');
    return await h2c(cardRef.current, {
      backgroundColor: '#0e1210',
      scale: 2,
      useCORS: true,
      logging: false,
    });
  };

  const downloadPNG = async () => {
    try {
      window.__toast?.('Generando imagen...');
      const canvas = await captureCanvas();
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${slug}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        window.__toast?.('PNG descargado');
      }, 'image/png');
    } catch (e) { window.__toast?.('Error al exportar PNG'); }
  };

  const downloadPDF = async () => {
    try {
      window.__toast?.('Generando PDF...');
      const canvas = await captureCanvas();
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) throw new Error('jsPDF no cargó');
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let w = pageW - 20, h = w / ratio;
      if (h > pageH - 20) { h = pageH - 20; w = h * ratio; }
      pdf.addImage(imgData, 'JPEG', (pageW-w)/2, (pageH-h)/2, w, h);
      pdf.save(`${slug}.pdf`);
      window.__toast?.('PDF descargado');
    } catch (e) { window.__toast?.('Error al exportar PDF'); }
  };

  const downloadICS = () => {
    try {
      const pad = n => String(n).padStart(2,'0');
      const dt = match.date.replace(/-/g,'') + 'T' + match.time.replace(':','') + '00';
      const [y,mo,d] = match.date.split('-').map(Number);
      const [hh,mm] = match.time.split(':').map(Number);
      const end = new Date(y, mo-1, d, hh, mm + 90);
      const dtEnd = `${end.getFullYear()}${pad(end.getMonth()+1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
      const now = new Date();
      const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
      const esc = (s) => String(s||'').replace(/[\\,;]/g,'\\$&').replace(/\n/g,'\\n');
      const ics = [
        'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//futbolClub//ES','CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@futbolclub`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${dt}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${esc(`${draft.name} vs ${match.opponent}`)}`,
        `LOCATION:${esc(match.venue)}`,
        `DESCRIPTION:${esc(`Formación ${formation.name} · Fut ${mode} · ${players.filter(Boolean).length}/${size} jugadores`)}`,
        'END:VEVENT','END:VCALENDAR'
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${slug}.ics`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      window.__toast?.('Evento .ics descargado');
    } catch (e) { window.__toast?.('Error al exportar .ics'); }
  };

  const nativeShare = async () => {
    const text = `${shareText}\n${shareURL}`;
    if (navigator.share) {
      try {
        const canvas = await captureCanvas();
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        const file = new File([blob], `${slug}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: draft.name, text, files: [file] });
          return;
        }
        await navigator.share({ title: draft.name, text, url: shareURL });
      } catch (_) {}
    } else {
      copyLink();
    }
  };

  const openWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareURL)}`, '_blank');
  const openTW = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareURL)}`, '_blank');
  const openTG = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareURL)}&text=${encodeURIComponent(shareText)}`, '_blank');
  const openIG = async () => {
    try { await navigator.clipboard.writeText(`${shareText} ${shareURL}`); } catch (_) {}
    window.__toast?.('Texto copiado · abrí Instagram y pegá');
    window.open('https://instagram.com', '_blank');
  };

  const kicker = (() => {
    try {
      const d = new Date(match.date + 'T' + match.time);
      const days = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
      return `${days[d.getDay()]} · ${match.venue.toUpperCase()} · ${match.time}`;
    } catch (_) { return `${match.venue} · ${match.time}`; }
  })();

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Compartir</div>
          <h1 className="page-title">Mandá la alineación</h1>
          <div className="page-sub">Descargá como imagen, PDF o evento de calendario · link directo o deep-link a redes.</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" onClick={copyLink}>📋 Copiar link</button>
          <button className="btn" onClick={downloadPNG}>💾 Descargar PNG</button>
          <button className="btn primary" onClick={nativeShare}>📲 Compartir</button>
        </div>
      </div>

      <div className="share-layout">
        <div className="share-preview">
          <div className="share-style-tabs">
            <button className={styleTab==='card'?'on':''} onClick={()=>setStyleTab('card')}>Card</button>
            <button className={styleTab==='list'?'on':''} onClick={()=>setStyleTab('list')}>Lista</button>
            <button className={styleTab==='stories'?'on':''} onClick={()=>setStyleTab('stories')}>Stories 9:16</button>
          </div>

          <div className="share-capture-wrap">
            {styleTab === 'card' && (
              <div className="share-card" ref={cardRef}>
                <div className="share-card-head">
                  <div>
                    {include.venue && <div className="share-kicker">{kicker}</div>}
                    <div className="share-title">{(draft.name || 'MI EQUIPO').toUpperCase()}</div>
                  </div>
                  {include.kit && (
                    <Kit design={kit.design} primary={kit.primary} secondary={kit.secondary} number={10} size={70} showNumber={true}/>
                  )}
                </div>
                <div className="share-card-pitch">
                  <Pitch mode={mode} formationIndex={formIdx} players={players} kit={kit}
                         interactive={false} style="classic" showNames={include.names}
                         positionOverrides={overrides} label={formation.name}/>
                </div>
                <div className="share-card-foot">
                  <div className="share-meta-item"><span>Formación</span><strong>{formation.name}</strong></div>
                  <div className="share-meta-item"><span>Fut</span><strong>{mode}v{mode}</strong></div>
                  <div className="share-meta-item"><span>Capitán</span><strong>{captain}</strong></div>
                  {include.venue ? (
                    <div className="share-meta-item"><span>{match.venue}</span><strong>{match.time}</strong></div>
                  ) : (
                    <div className="share-meta-item"><span>Jugadores</span><strong>{players.filter(Boolean).length}/{size}</strong></div>
                  )}
                </div>
                {include.stats && match.myScore != null && (
                  <div className="share-stats-row">
                    <span>ÚLTIMO</span>
                    <strong style={{color: match.myScore > match.theirScore ? 'var(--accent)' : match.myScore < match.theirScore ? 'var(--accent-2)' : 'var(--fg-mute)'}}>
                      {match.myScore}–{match.theirScore}
                    </strong>
                    <span>vs {match.opponent}</span>
                  </div>
                )}
                {include.watermark && <div className="share-watermark">futbolClub.app</div>}
              </div>
            )}

            {styleTab === 'list' && (
              <div className="share-card list" ref={cardRef}>
                <div className="share-card-head">
                  <div>
                    {include.venue && <div className="share-kicker">{kicker}</div>}
                    <div className="share-title">{(draft.name || 'MI EQUIPO').toUpperCase()}</div>
                  </div>
                  {include.kit && (
                    <Kit design={kit.design} primary={kit.primary} secondary={kit.secondary} number={10} size={70} showNumber={true}/>
                  )}
                </div>
                <div className="share-list-grid">
                  {players.filter(Boolean).map((p) => (
                    <div key={p.id} className="share-list-item">
                      <div className="share-list-num">#{p.num}</div>
                      <div>
                        {include.names && <div className="share-list-name">{p.name}</div>}
                        <div className="share-list-pos">{p.pos}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {include.watermark && <div className="share-watermark">futbolClub.app</div>}
              </div>
            )}

            {styleTab === 'stories' && (
              <div className="share-card stories" ref={cardRef}>
                <div style={{padding:'20px 24px', flex:1, display:'flex', flexDirection:'column'}}>
                  {include.venue && <div className="share-kicker">{kicker}</div>}
                  <div className="share-title" style={{fontSize:48}}>{(draft.name || 'MI EQUIPO').toUpperCase()}</div>
                  <div style={{marginTop:20, flex:1, display:'flex'}}>
                    <Pitch mode={mode} formationIndex={formIdx} players={players} kit={kit}
                           interactive={false} style="classic" showNames={include.names}
                           positionOverrides={overrides}/>
                  </div>
                  {include.watermark && <div className="share-watermark" style={{position:'static', marginTop:10}}>futbolClub.app</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="share-side">
          <div className="panel">
            <div className="panel-head">Partido</div>
            <div className="match-fields">
              <label>
                <span>Fecha</span>
                <input type="date" value={match.date} onChange={e=>setMatch(m=>({...m, date: e.target.value}))}/>
              </label>
              <label>
                <span>Hora</span>
                <input type="time" value={match.time} onChange={e=>setMatch(m=>({...m, time: e.target.value}))}/>
              </label>
              <label>
                <span>Cancha</span>
                <input type="text" value={match.venue} onChange={e=>setMatch(m=>({...m, venue: e.target.value}))}/>
              </label>
              <label>
                <span>Rival</span>
                <input type="text" value={match.opponent} onChange={e=>setMatch(m=>({...m, opponent: e.target.value}))}/>
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Vínculos</div>
            <div className="share-link-row">
              <input value={shareURL} readOnly onClick={e=>e.target.select()}/>
              <button className="btn sm" onClick={copyLink}>Copiar</button>
            </div>
            <div className="share-socials">
              <button className="social wa" onClick={openWA}>WhatsApp</button>
              <button className="social ig" onClick={openIG}>Instagram</button>
              <button className="social tw" onClick={openTW}>X / Twitter</button>
              <button className="social tg" onClick={openTG}>Telegram</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Incluir</div>
            <label className="toggle-row"><input type="checkbox" checked={include.names} onChange={()=>tog('names')}/> <span>Nombres de jugadores</span></label>
            <label className="toggle-row"><input type="checkbox" checked={include.kit} onChange={()=>tog('kit')}/> <span>Camiseta</span></label>
            <label className="toggle-row"><input type="checkbox" checked={include.venue} onChange={()=>tog('venue')}/> <span>Cancha y horario</span></label>
            <label className="toggle-row"><input type="checkbox" checked={include.stats} onChange={()=>tog('stats')}/> <span>Estadísticas último partido</span></label>
            <label className="toggle-row"><input type="checkbox" checked={include.watermark} onChange={()=>tog('watermark')}/> <span>Marca de agua</span></label>
          </div>

          <div className="panel">
            <div className="panel-head">Exportar como</div>
            <div className="export-grid">
              <button className="export-opt" onClick={downloadPNG}>PNG<br/><span>1080×1350</span></button>
              <button className="export-opt" onClick={downloadPDF}>PDF<br/><span>A4</span></button>
              <button className="export-opt" onClick={downloadICS}>.ics<br/><span>Calendario</span></button>
              <button className="export-opt" onClick={copyLink}>Link<br/><span>Vista web</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const shareCSS = document.createElement("style");
shareCSS.textContent = `
  .share-layout { display: grid; grid-template-columns: 1fr 320px; gap: 18px; align-items: start; }
  @media (max-width: 1100px) { .share-layout { grid-template-columns: 1fr; } }

  .share-preview {
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    padding: 20px;
  }
  .share-style-tabs {
    display: inline-flex;
    background: var(--bg-elev-2);
    border: 1px solid var(--line);
    border-radius: 6px; overflow: hidden;
    margin-bottom: 16px;
  }
  .share-style-tabs button {
    padding: 6px 14px; color: var(--fg-mute); font-size: 12px;
    background: transparent;
  }
  .share-style-tabs button.on { background: var(--accent); color: #0e1210; font-weight: 600; }

  .share-capture-wrap { display: flex; justify-content: center; }

  .share-card {
    background: linear-gradient(160deg, #101815, #0c1210);
    border: 1px solid var(--line);
    border-radius: var(--radius-l);
    padding: 22px;
    max-width: 520px;
    width: 100%;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
  }
  .share-card.stories {
    max-width: 360px;
    aspect-ratio: 9/16;
    padding: 0;
    display: flex;
  }
  .share-card.list { max-width: 560px; }
  .share-card-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 16px;
  }
  .share-kicker {
    font-family: var(--font-cond);
    font-size: 11px; letter-spacing: 2px;
    color: var(--accent); text-transform: uppercase;
    margin-bottom: 2px;
  }
  .share-title {
    font-family: var(--font-display);
    font-size: 38px; letter-spacing: 1px;
    line-height: .95;
  }
  .share-title span { color: var(--fg-dim); }

  .share-card-pitch { margin: 0 -6px; max-height: 540px; }
  .share-card-pitch .pitch-wrap { max-height: 540px; }

  .share-card-foot {
    display: grid; grid-template-columns: repeat(4,1fr); gap: 1px;
    background: var(--line-soft); border-radius: 6px;
    overflow: hidden; margin-top: 16px;
  }
  .share-meta-item { background: var(--bg-elev-2); padding: 8px 10px; }
  .share-meta-item span {
    display: block; font-family: var(--font-cond); font-size: 10px;
    letter-spacing: 1.4px; color: var(--fg-dim); text-transform: uppercase;
  }
  .share-meta-item strong { font-family: var(--font-cond); font-size: 14px; }

  .share-stats-row {
    display: flex; align-items: baseline; gap: 10px;
    margin-top: 10px; padding: 10px 14px;
    background: var(--bg-elev-2); border-radius: 6px;
    font-family: var(--font-cond); font-size: 12px;
    text-transform: uppercase; letter-spacing: 1.4px;
    color: var(--fg-dim);
  }
  .share-stats-row strong {
    font-family: var(--font-display); font-size: 28px;
    letter-spacing: 1px; line-height: 1;
    color: var(--fg);
  }

  .share-list-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;
  }
  .share-list-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px;
    background: var(--bg-elev-2); border-radius: 6px;
  }
  .share-list-num {
    font-family: var(--font-display); font-size: 28px;
    color: var(--accent); line-height: 1;
  }
  .share-list-name { font-weight: 600; }
  .share-list-pos { font-family: var(--font-mono); font-size: 10px; color: var(--fg-dim); }

  .share-watermark {
    position: absolute; bottom: 10px; right: 14px;
    font-family: var(--font-mono); font-size: 10px; color: var(--fg-dim);
    letter-spacing: 1px;
  }

  .share-side { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 20px; }

  .match-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .match-fields label { display: flex; flex-direction: column; gap: 4px; }
  .match-fields label:nth-child(3), .match-fields label:nth-child(4) { grid-column: span 2; }
  .match-fields span {
    font-family: var(--font-cond); font-size: 10px; letter-spacing: 1.4px;
    text-transform: uppercase; color: var(--fg-dim);
  }
  .match-fields input {
    background: var(--bg-elev-2); border: 1px solid var(--line);
    border-radius: 6px; padding: 8px 10px; font-size: 13px;
    color: var(--fg); outline: none;
    font-family: var(--font-body);
    color-scheme: dark;
  }
  .match-fields input:focus { border-color: var(--accent); }

  .share-link-row { display: flex; gap: 6px; margin-bottom: 10px; }
  .share-link-row input {
    flex: 1; padding: 8px 10px; font-family: var(--font-mono); font-size: 12px;
    background: var(--bg-elev-2); border: 1px solid var(--line);
    border-radius: 6px; color: var(--fg); outline: none; min-width: 0;
  }
  .share-socials { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .social {
    padding: 8px; background: var(--bg-elev-2);
    border: 1px solid var(--line); border-radius: 6px;
    color: var(--fg); font-size: 12px; font-weight: 500;
  }
  .social:hover { border-color: var(--accent); }
  .social.wa:hover { border-color: #25D366; color: #25D366; }
  .social.tw:hover { border-color: #1DA1F2; color: #1DA1F2; }
  .social.tg:hover { border-color: #2AABEE; color: #2AABEE; }
  .social.ig:hover { border-color: #E4405F; color: #E4405F; }

  .toggle-row {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 0; font-size: 13px; color: var(--fg-mute);
    cursor: pointer;
  }
  .toggle-row input { accent-color: var(--accent); }

  .export-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .export-opt {
    padding: 10px; background: var(--bg-elev-2);
    border: 1px solid var(--line); border-radius: 6px;
    color: var(--fg); font-family: var(--font-cond); font-weight: 700;
    font-size: 13px; letter-spacing: 1px;
    cursor: pointer;
  }
  .export-opt span {
    display: block; font-family: var(--font-mono); font-weight: 400;
    font-size: 10px; color: var(--fg-dim); letter-spacing: 0;
  }
  .export-opt:hover { border-color: var(--accent); color: var(--accent); }
`;
document.head.appendChild(shareCSS);

ReactDOM.createRoot(document.getElementById("page-share")).render(<SharePage/>);

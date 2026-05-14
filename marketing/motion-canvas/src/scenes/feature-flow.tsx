import { makeScene2D, Rect, Circle, Txt, Layout, Line } from '@motion-canvas/2d';
import { all, chain, createRef, range, waitFor, easeOutBack, easeInOutCubic, sequence } from '@motion-canvas/core';
import { C, FONT_DISPLAY, FONT_MONO } from '../theme';

// 45s demo larga: 5 features con transiciones
export default makeScene2D(function* (view) {
  view.fill(C.paper);

  const titleBar = createRef<Rect>();
  const titleTxt = createRef<Txt>();
  const stage = createRef<Layout>();

  view.add(
    <>
      <Rect ref={titleBar} size={[1920, 140]} fill={C.ink} y={-470} />
      <Txt ref={titleTxt} text="" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={72} fill={C.lime} y={-470} />
      <Layout ref={stage} y={80} />
    </>
  );

  const setTitle = function* (text: string) {
    yield* titleTxt().opacity(0, 0.2);
    titleTxt().text(text);
    yield* titleTxt().opacity(1, 0.3);
  };

  // ---------- 1. EDITOR (0–9s) ----------
  yield* setTitle('01 · EDITOR DE ALINEACIÓN');
  const pitch = createRef<Rect>();
  stage().add(<Rect ref={pitch} size={[1100, 620]} fill={C.pitch} radius={20} stroke={C.paper} lineWidth={4} />);
  yield* pitch().opacity(0).opacity(1, 0.4);

  const players = range(8).map(() => createRef<Circle>());
  const positions: [number, number][] = [
    [0, 240], [-400, 100], [400, 100], [-450, -120], [-150, -120], [150, -120], [450, -120], [0, -250],
  ];
  positions.forEach((p, i) => {
    stage().add(<Circle ref={players[i]} size={70} fill={C.lime} stroke={C.ink} lineWidth={3} position={p} scale={0} />);
  });
  yield* sequence(0.08, ...players.map(p => p().scale(1, 0.4, easeOutBack)));
  yield* waitFor(0.5);
  // simulate drag
  yield* players[0]().position([180, 220], 0.6, easeInOutCubic);
  yield* players[0]().position([-180, 220], 0.6, easeInOutCubic);
  yield* waitFor(0.4);

  yield* all(
    pitch().opacity(0, 0.4),
    ...players.map(p => p().scale(0, 0.3)),
  );

  // ---------- 2. SORTEO (9–18s) ----------
  yield* setTitle('02 · SORTEO BALANCEADO');
  const wheel = createRef<Circle>();
  const teamA = createRef<Rect>();
  const teamB = createRef<Rect>();
  stage().add(
    <>
      <Circle ref={wheel} size={420} stroke={C.ink} lineWidth={8} fill={C.cyan} />
      <Rect ref={teamA} size={[280, 360]} fill={C.lime} radius={16} position={[-500, 0]} opacity={0} />
      <Rect ref={teamB} size={[280, 360]} fill={C.red} radius={16} position={[500, 0]} opacity={0} />
    </>
  );
  yield* wheel().scale(0).scale(1, 0.5, easeOutBack);
  yield* wheel().rotation(720, 1.4, easeInOutCubic);
  yield* all(
    wheel().size(0, 0.5),
    teamA().opacity(1, 0.5),
    teamB().opacity(1, 0.5),
  );
  yield* waitFor(0.6);
  yield* all(teamA().opacity(0, 0.4), teamB().opacity(0, 0.4), wheel().lineWidth(0, 0.2));

  // ---------- 3. CAMISETAS (18–27s) ----------
  yield* setTitle('03 · DISEÑADOR DE CAMISETAS');
  const kits = ['#c6ff3d', '#33d6e6', '#ff3d4e', '#0c1410'];
  const kitRefs = kits.map(() => createRef<Rect>());
  kits.forEach((col, i) => {
    stage().add(<Rect ref={kitRefs[i]} size={[180, 240]} fill={col} radius={12} stroke={C.ink} lineWidth={4} position={[-600 + i * 400, 0]} scale={0} />);
  });
  yield* sequence(0.1, ...kitRefs.map(r => r().scale(1, 0.4, easeOutBack)));
  yield* waitFor(0.4);
  yield* sequence(0.05, ...kitRefs.map(r => r().scale(1.15, 0.25).to(1, 0.25)));
  yield* waitFor(0.5);
  yield* all(...kitRefs.map(r => r().scale(0, 0.3)));

  // ---------- 4. RIVAL (27–36s) ----------
  yield* setTitle('04 · MODO RIVAL');
  const rivalPitch = createRef<Rect>();
  stage().add(<Rect ref={rivalPitch} size={[1200, 500]} fill={C.pitch} radius={16} stroke={C.paper} lineWidth={4} />);
  yield* rivalPitch().opacity(0).opacity(1, 0.4);
  const dots = range(10).map(() => createRef<Circle>());
  for (let i = 0; i < 5; i++) {
    stage().add(<Circle ref={dots[i]} size={50} fill={C.lime} position={[-400, -150 + i * 80]} scale={0} />);
    stage().add(<Circle ref={dots[i + 5]} size={50} fill={C.red} position={[400, -150 + i * 80]} scale={0} />);
  }
  yield* sequence(0.05, ...dots.map(d => d().scale(1, 0.3, easeOutBack)));
  yield* waitFor(1);
  yield* all(rivalPitch().opacity(0, 0.4), ...dots.map(d => d().scale(0, 0.2)));

  // ---------- 5. COMPARTIR (36–45s) ----------
  yield* setTitle('05 · COMPARTIR');
  const networks = ['WhatsApp', 'Twitter', 'Telegram', 'Instagram'];
  const netRefs = networks.map(() => createRef<Rect>());
  const netTxt = networks.map(() => createRef<Txt>());
  networks.forEach((n, i) => {
    stage().add(
      <Rect ref={netRefs[i]} size={[340, 90]} fill={C.ink} radius={45} position={[0, -180 + i * 100]} scale={0}>
        <Txt ref={netTxt[i]} text={n} fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={42} fill={C.lime} />
      </Rect>
    );
  });
  yield* sequence(0.12, ...netRefs.map(r => r().scale(1, 0.4, easeOutBack)));
  yield* waitFor(0.6);

  // Final card
  const finalCard = createRef<Rect>();
  const finalTxt = createRef<Txt>();
  const finalCta = createRef<Txt>();
  view.add(
    <>
      <Rect ref={finalCard} size={[0, 0]} fill={C.ink} radius={24} y={80} />
      <Txt ref={finalTxt} text="futbolClub" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={0} fill={C.lime} y={20} />
      <Txt ref={finalCta} text="github.com/viceKDK/futLineUp" fontFamily={FONT_MONO} fontSize={0} fill={C.paper} y={140} />
    </>
  );
  yield* all(
    ...netRefs.map(r => r().scale(0, 0.3)),
    finalCard().size([900, 360], 0.6, easeOutBack),
  );
  yield* all(
    finalTxt().fontSize(120, 0.5, easeOutBack),
    finalCta().fontSize(38, 0.5, easeOutBack),
  );
  yield* waitFor(1.2);
});

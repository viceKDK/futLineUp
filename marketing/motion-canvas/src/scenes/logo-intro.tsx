import { makeScene2D, Circle, Txt, Line } from '@motion-canvas/2d';
import { all, createRef, easeOutBack, easeInOutCubic } from '@motion-canvas/core';
import { C, FONT_DISPLAY } from '../theme';

// 10s bumper / intro de marca
export default makeScene2D(function* (view) {
  view.fill(C.ink);

  const ball = createRef<Circle>();
  const ring = createRef<Circle>();
  const tFutbol = createRef<Txt>();
  const tClub = createRef<Txt>();
  const tag = createRef<Txt>();
  const underline = createRef<Line>();

  view.add(
    <>
      <Circle ref={ring} size={0} stroke={C.lime} lineWidth={8} />
      <Circle ref={ball} size={80} fill={C.paper} stroke={C.ink} lineWidth={6} position={[-900, 0]} />
      <Txt ref={tFutbol} text="futbol" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={0} fill={C.paper} position={[-200, 0]} />
      <Txt ref={tClub} text="Club" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={0} fill={C.lime} position={[200, 0]} />
      <Line ref={underline} points={[[-380, 130], [-380, 130]]} stroke={C.red} lineWidth={10} />
      <Txt ref={tag} text="Armá tu equipo. Compartí la formación." fontFamily={FONT_DISPLAY} fontSize={0} fill={C.paper} opacity={0.85} position={[0, 240]} />
    </>
  );

  // 0–2s: pelota entra, anillo se expande
  yield* all(
    ball().position([0, 0], 1.2, easeOutBack),
    ring().size(400, 1.2, easeOutBack),
  );

  // 2–4s: pelota se transforma en logo
  yield* all(
    ball().size(0, 0.5, easeInOutCubic),
    ring().lineWidth(0, 0.5),
    tFutbol().fontSize(180, 0.8, easeOutBack),
    tClub().fontSize(180, 0.8, easeOutBack),
  );

  // 4–5s: subrayado
  yield* underline().points([[-380, 130], [380, 130]], 0.6, easeInOutCubic);

  // 5–7s: tagline
  yield* tag().fontSize(48, 0.7, easeOutBack);

  // 7–10s: hold + leve breathing
  yield* all(
    tFutbol().scale(1.02, 1.5).to(1, 1.5),
    tClub().scale(1.02, 1.5).to(1, 1.5),
  );
});

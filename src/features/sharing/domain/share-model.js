const DEFAULT_INCLUDE = Object.freeze({
  names: true,
  kit: true,
  venue: true,
  stats: false,
  watermark: true,
});
const DEFAULT_KIT = Object.freeze({
  design: "solid",
  primary: "#3b82f6",
  secondary: "#ffffff",
});
const HIDDEN_KIT = Object.freeze({
  design: "solid",
  primary: "#64748b",
  secondary: "#ffffff",
});
const text = (value, max) => String(value ?? "").slice(0, max);
const validId = (value) =>
  typeof value === "string" ||
  (typeof value === "number" && Number.isFinite(value));

export function fileSlug(value) {
  return (
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/, "") || "equipo"
  );
}

function projectPlayer(player, names) {
  return {
    id: player.id,
    name: names ? text(player.name, 80) : "",
    num: Number.isFinite(Number(player.num)) ? Number(player.num) : 0,
    pos: text(player.pos, 12),
    photo: names && typeof player.photo === "string" ? player.photo : null,
    secondaryPos: text(player.secondaryPos, 12),
    preferredFoot: text(player.preferredFoot, 12),
    active: player.active !== false,
  };
}

function projectPositions(positions, size) {
  return Array.from({ length: size }, (_, index) => {
    const point = positions?.[index];
    return Array.isArray(point) &&
      point.length === 2 &&
      point.every((v) => Number.isFinite(v) && v >= 0 && v <= 100)
      ? [point[0], point[1]]
      : null;
  });
}

/** A projection, not a copy of arbitrary player records: private fields never escape. */
export function buildShareModel(
  { draft = {}, roster = [], match = {}, include = {}, kitMode = "main" },
  formations,
) {
  const mode = Number(draft.mode ?? 7);
  if (!Object.hasOwn(formations, mode) || !formations[mode]?.length) {
    throw new Error("El modo compartido no es válido");
  }
  const requestedIndex = Number(draft.formIdx ?? 0);
  const formIdx =
    Number.isInteger(requestedIndex) &&
    requestedIndex >= 0 &&
    requestedIndex < formations[mode].length
      ? requestedIndex
      : 0;
  const formation = formations[mode][formIdx];
  const size = formation.positions.length;
  const flags = Object.fromEntries(
    Object.entries(DEFAULT_INCLUDE).map(([key, fallback]) => [
      key,
      typeof include[key] === "boolean" ? include[key] : fallback,
    ]),
  );
  const kitSource =
    (kitMode === "alt" && draft.altKit) || draft.kit || DEFAULT_KIT;
  const kit = flags.kit
    ? {
        design: text(kitSource.design || DEFAULT_KIT.design, 30),
        primary: text(kitSource.primary || DEFAULT_KIT.primary, 50),
        secondary: text(kitSource.secondary || DEFAULT_KIT.secondary, 50),
      }
    : { ...HIDDEN_KIT };
  const byId = new Map(
    roster
      .filter((player) => player && validId(player.id))
      .map((player) => [player.id, player]),
  );
  const used = new Set();
  const assignedIds = Array.from({ length: size }, (_, index) => {
    const id = draft.assignedIds?.[index];
    if (!byId.has(id) || used.has(id)) return null;
    used.add(id);
    return id;
  });
  const substituteIds = [
    ...new Set(Array.isArray(draft.substituteIds) ? draft.substituteIds : []),
  ]
    .filter((id) => byId.has(id) && !used.has(id))
    .slice(0, 100 - used.size);
  const projectedRoster = [...used, ...substituteIds].map((id) =>
    projectPlayer(byId.get(id), flags.names),
  );
  const projectedById = new Map(
    projectedRoster.map((player) => [player.id, player]),
  );
  const players = assignedIds.map((id) => projectedById.get(id) || null);
  const captainId = used.has(draft.captainId) ? draft.captainId : null;
  const captainPlayer =
    draft.captainId == null
      ? players.find(Boolean)
      : projectedById.get(captainId);
  const captain = flags.names ? captainPlayer?.name || "—" : "—";
  const freeKey = `${mode}:${formIdx}`;
  const overrides = draft.freeMode
    ? projectPositions(draft.freePositions?.[freeKey], size)
    : null;
  const name = text(draft.name || "Mi equipo", 80);
  const cleanMatch = {
    date: text(match.date, 20),
    time: text(match.time, 10),
    venue: text(match.venue, 120),
    opponent: text(match.opponent, 80),
    myScore: Number.isFinite(match.myScore) ? match.myScore : null,
    theirScore: Number.isFinite(match.theirScore) ? match.theirScore : null,
  };
  const publicMatch = {
    ...cleanMatch,
    date: flags.venue ? cleanMatch.date : "",
    time: flags.venue ? cleanMatch.time : "",
    venue: flags.venue ? cleanMatch.venue : "",
    myScore: flags.stats ? cleanMatch.myScore : null,
    theirScore: flags.stats ? cleanMatch.theirScore : null,
  };
  const projectedDraft = {
    name,
    mode,
    formIdx,
    kit,
    altKit: null,
    activeKit: "main",
    assignedIds,
    substituteIds,
    captainId,
    freeMode: !!draft.freeMode,
    freePositions: overrides ? { [freeKey]: overrides } : {},
  };
  const shareText = [
    `Alineación ${name} (${formation.name})`,
    flags.venue
      ? [cleanMatch.date, cleanMatch.time, cleanMatch.venue]
          .filter(Boolean)
          .join(" · ")
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    draft: projectedDraft,
    match: cleanMatch,
    include: flags,
    mode,
    formIdx,
    formation,
    size,
    kit,
    players,
    captain,
    overrides,
    slug: fileSlug(name),
    text: shareText,
    kicker: [
      publicMatch.date,
      publicMatch.venue.toUpperCase(),
      publicMatch.time,
    ]
      .filter(Boolean)
      .join(" · "),
    payload: {
      draft: projectedDraft,
      roster: projectedRoster,
      match: publicMatch,
      include: flags,
    },
  };
}

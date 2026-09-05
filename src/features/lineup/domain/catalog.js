const formation = (name, positions) => ({ name, positions });
// Coordinates: x left-to-right; y own goal (0) to rival goal (100).
export const FORMATIONS = {
  5: [
    formation("1-2-1", [[50, 8], [30, 30], [70, 30], [50, 55], [50, 78]]), formation("1-1-2", [[50, 8], [50, 30], [50, 52], [30, 76], [70, 76]]), formation("Rombo", [[50, 8], [50, 28], [30, 52], [70, 52], [50, 76]])
  ],
  6: [
    formation("2-1-2", [[50, 8], [30, 24], [70, 24], [50, 48], [30, 72], [70, 72]]), formation("1-2-2", [[50, 8], [50, 24], [30, 46], [70, 46], [30, 72], [70, 72]]), formation("1-3-1", [[50, 8], [50, 24], [25, 50], [50, 50], [75, 50], [50, 76]])
  ],
  7: [
    formation("2-3-1", [[50, 8], [32, 22], [68, 22], [22, 48], [50, 48], [78, 48], [50, 76]]), formation("3-2-1", [[50, 8], [22, 24], [50, 24], [78, 24], [35, 50], [65, 50], [50, 76]]), formation("2-1-2-1", [[50, 8], [32, 22], [68, 22], [50, 40], [30, 60], [70, 60], [50, 78]])
  ],
  8: [
    formation("3-3-1", [[50, 8], [22, 22], [50, 22], [78, 22], [22, 48], [50, 48], [78, 48], [50, 76]]), formation("2-3-2", [[50, 8], [32, 22], [68, 22], [22, 46], [50, 46], [78, 46], [35, 72], [65, 72]]), formation("3-1-2-1", [[50, 8], [22, 22], [50, 22], [78, 22], [50, 42], [32, 62], [68, 62], [50, 80]])
  ],
  11: [
    formation("4-4-2", [
      [50, 6], [14, 22], [38, 22], [62, 22], [86, 22], [14, 48], [38, 48], [62, 48], [86, 48], [38, 74], [62, 74]
    ]), formation("4-3-3", [
      [50, 6], [14, 22], [38, 22], [62, 22], [86, 22], [28, 46], [50, 46], [72, 46], [20, 74], [50, 72], [80, 74]
    ]), formation("3-5-2", [
      [50, 6], [26, 22], [50, 22], [74, 22], [10, 44], [30, 48], [50, 44], [70, 48], [90, 44], [38, 74], [62, 74]
    ]), formation("4-2-3-1", [
      [50, 6], [14, 22], [38, 22], [62, 22], [86, 22], [34, 40], [66, 40], [18, 60], [50, 60], [82, 60], [50, 80]
    ]), formation("5-3-2", [
      [50, 6], [10, 22], [30, 22], [50, 22], [70, 22], [90, 22], [28, 48], [50, 48], [72, 48], [38, 74], [62, 74]
    ])
  ],
};
export const DEFAULT_ROSTER = [
  { id: 1, name: "Martín", num: 10, pos: "MED", photo: null }, { id: 2, name: "Nahuel", num: 1, pos: "ARQ", photo: null },
  { id: 3, name: "Facu", num: 4, pos: "DEF", photo: null }, { id: 4, name: "Tomi", num: 5, pos: "MED", photo: null },
  { id: 5, name: "Seba", num: 7, pos: "DEL", photo: null }, { id: 6, name: "Juampi", num: 9, pos: "DEL", photo: null },
  { id: 7, name: "Lucho", num: 8, pos: "MED", photo: null }, { id: 8, name: "Agus", num: 3, pos: "DEF", photo: null },
  { id: 9, name: "Pato", num: 2, pos: "DEF", photo: null }, { id: 10, name: "Dieguito", num: 11, pos: "DEL", photo: null },
  { id: 11, name: "Rama", num: 6, pos: "DEF", photo: null }, { id: 12, name: "Joaco", num: 14, pos: "MED", photo: null },
  { id: 13, name: "Fede", num: 17, pos: "DEL", photo: null }, { id: 14, name: "Ema", num: 22, pos: "MED", photo: null },
  { id: 15, name: "Cami", num: 20, pos: "DEF", photo: null }, { id: 16, name: "Brian", num: 13, pos: "MED", photo: null },
  { id: 17, name: "Iván", num: 19, pos: "DEL", photo: null }, { id: 18, name: "Gonza", num: 21, pos: "DEF", photo: null },
  { id: 19, name: "Rodri", num: 16, pos: "MED", photo: null }, { id: 20, name: "Lauti", num: 23, pos: "DEL", photo: null },
];
export const DEFAULT_SAVED_TEAMS = [
  {
    id: "t1", name: "Los Pibes del Viernes", mode: 7, formation: "2-3-1", formIdx: 0, kit: "solid", color: "#e11d48", secondary: "#0f172a", lastPlayed: "hace 3 días", players: 12
  },
  {
    id: "t2", name: "La Banda del Asado", mode: 5, formation: "1-2-1", formIdx: 0, kit: "stripes", color: "#1e40af", secondary: "#ffffff", lastPlayed: "la semana pasada", players: 8
  },
  {
    id: "t3", name: "FC Sobremesa", mode: 11, formation: "4-3-3", formIdx: 1, kit: "sash", color: "#0f172a", secondary: "#dc2626", lastPlayed: "hace 1 mes", players: 16
  },
  {
    id: "t4", name: "Canchita Palermo", mode: 8, formation: "3-3-1", formIdx: 0, kit: "halves", color: "#16a34a", secondary: "#0f172a", lastPlayed: "ayer", players: 11
  },
];
export const DEFAULT_PROFILE = { experience: "friends", displayName: "", season: "", onboardingDone: false };

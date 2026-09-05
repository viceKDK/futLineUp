const DAY = 86400000;
export function inLastDays(date, days, from = new Date()) { const time = new Date(date).getTime(), now = new Date(from).getTime(); if (!Number.isFinite(time) || !Number.isFinite(now)) return false; const diff = (now - time) / DAY; return diff >= 0 && diff < days; }
export function attendancePct(playerId, sessions, attendance) { if (!sessions.length) return 0; const attended = sessions.filter((session) => (attendance[session.id] || []).includes(playerId)).length; return Math.round(attended / sessions.length * 100); }
export function lastEvaluation(playerId, evaluations) { return evaluations.filter((item) => item.playerId === playerId).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null; }
export function ratingsTrend(playerId, evaluations) { return evaluations.filter((item) => item.playerId === playerId).sort((a, b) => String(a.date).localeCompare(String(b.date))).map((item) => Number(item.rating) || 0); }
export function toggleAttendance(attendance, sessionId, playerId) { const next = { ...attendance }, ids = new Set(next[sessionId] || []); ids.has(playerId) ? ids.delete(playerId) : ids.add(playerId); next[sessionId] = [...ids]; return next; }
export function createSession({ title, date }, idFactory) { const cleanDate = String(date || "").trim(); if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) throw new Error("Fecha de entrenamiento inválida"); return { id: idFactory(), title: String(title || "").trim() || "Entrenamiento", date: cleanDate }; }
export function createEvaluation({ playerId, form, date }, idFactory) { if (playerId == null) throw new Error("Seleccioná un jugador"); const rating = Number(form?.rating); if (!Number.isFinite(rating) || rating < 0 || rating > 10) throw new Error("La nota debe estar entre 0 y 10"); return { id: idFactory(), playerId, date, ...form, rating }; }
export function setPlayerAttribute(roster, playerId, key, value, defaults = {}) { const number = Number(value); if (!Number.isFinite(number) || number < 1 || number > 10) throw new Error("Atributo inválido"); return roster.map((player) => player.id === playerId ? { ...player, attrs: { ...(player.attrs || defaults), [key]: number } } : player); }
export function addObjective(objectives, playerId, text, idFactory) { const clean = String(text || "").trim(); if (!clean) return objectives; return [...objectives, { id: idFactory(), playerId, text: clean, done: false }]; }
export function toggleObjective(objectives, id) { return objectives.map((objective) => objective.id === id ? { ...objective, done: !objective.done } : objective); }
export function deleteObjective(objectives, id) { return objectives.filter((objective) => objective.id !== id); }
export function coachOverview({ roster, sessions, attendance, evaluations, now = new Date() }) {
  const month = new Date(now).toISOString().slice(0, 7), sessionsThisMonth = sessions.filter((session) => String(session.date).slice(0, 7) === month).length;
  const evaluationsLast30 = evaluations.filter((evaluation) => inLastDays(evaluation.date, 30, now)).length;
  const avgRating = evaluations.length ? evaluations.reduce((sum, evaluation) => sum + Number(evaluation.rating || 0), 0) / evaluations.length : null;
  const avgAttendance = sessions.length ? Math.round(roster.reduce((sum, player) => sum + attendancePct(player.id, sessions, attendance), 0) / (roster.length || 1)) : 0;
  const sorted = sessions.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))), today = new Date(now).toISOString().slice(0, 10);
  const nextSession = sorted.find((session) => session.date >= today) || sorted.at(-1) || null;
  return { sessionsThisMonth, evaluationsLast30, avgRating, avgAttendance, nextSession };
}

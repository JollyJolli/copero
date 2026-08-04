export function command(registry, data) {
  return registry.register({ examples: [], aliases: [], dangerous: false, validate: () => {}, ...data });
}
export function resolveSeasonIndexes(state, selector = 'last') {
  const seasons = state.seasons; if (!seasons.length) throw new Error('No existen temporadas.');
  if (selector == null || selector === 'last') return [seasons.length - 1];
  if (selector === 'first') return [0]; if (selector === 'all') return seasons.map((_, i) => i);
  if (typeof selector === 'number') { const i = selector < 0 ? seasons.length + selector : selector - 1; if (!seasons[i]) throw new Error(`No existe la temporada ${selector}.`); return [i]; }
  if (typeof selector === 'string') { const i = seasons.findIndex(s => s.id === selector); if (i < 0) throw new Error(`No existe temporada con id ${selector}.`); return [i]; }
  if (selector && typeof selector === 'object') { const indexes = seasons.map((s, i) => ({ s, i })).filter(({ s }) => Object.entries(selector).every(([k, v]) => s[k] === v)).map(x => x.i); if (!indexes.length) throw new Error('Ninguna temporada coincide.'); return indexes; }
  throw new Error('Selector de temporada inválido.');
}
export function recalculateTotals(state) {
  const totals = { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, goalsConceded: 0, trophies: 0, awards: 0 };
  for (const item of [...(state.seasons ?? []), ...(state.nationalTeamPeriods ?? [])]) {
    for (const key of ['appearances', 'goals', 'assists', 'cleanSheets', 'goalsConceded']) totals[key] += Number(item.stats?.[key]) || 0;
    totals.trophies += item.trophies?.length ?? 0; totals.awards += item.awards?.length ?? 0;
  } return totals;
}

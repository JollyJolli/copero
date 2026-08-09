import { command, resolveSeasonIndexes, recalculateTotals } from './helpers.js';
export const TROPHIES = ['league','cup','continental_primary','continental_secondary','club_world_cup','national_continental','world_cup'];
export const AWARDS = ['ballon_dor','golden_boot','golden_glove'];
function registerCollection(registry, plural, singular, known, legacyAdd, legacyRemove) {
  command(registry, { name: `${plural}.add`, category: plural, description: `Añade ${singular}.`, usage: `careerEditor.${plural}.add(id)`, aliases: [legacyAdd], execute: ({ stateManager, config }, id, options = {}) => { id = String(id); if (config.safeMode && !known.includes(id)) throw new Error(`${singular} desconocido: ${id}.`); const amount = Number(options.amount ?? 1); return stateManager.mutate(`${singular} añadido`, d => { for (const i of resolveSeasonIndexes(d, options.season ?? 'last')) { const list = d.seasons[i][plural] ??= []; for (let n = 0; n < amount; n++) if (options.allowDuplicates || !list.includes(id)) list.push(id); } d.totals = recalculateTotals(d); }); } });
  command(registry, { name: `${plural}.remove`, category: plural, description: `Elimina ${singular}.`, usage: `careerEditor.${plural}.remove(id)`, aliases: [legacyRemove], execute: ({ stateManager }, id, selector = 'last') => stateManager.mutate(`${singular} eliminado`, d => { for (const i of resolveSeasonIndexes(d, selector)) d.seasons[i][plural] = (d.seasons[i][plural] ?? []).filter(x => x !== id); d.totals = recalculateTotals(d); }) });
  command(registry, { name: `${plural}.set`, category: plural, description: `Fija cantidad de ${singular}.`, usage: `careerEditor.${plural}.set(id,n)`, execute: (ctx, id, amount, selector = 'last') => { ctx.registry.get(`${plural}.remove`).execute(ctx, id, selector); return ctx.registry.get(`${plural}.add`).execute(ctx, id, { amount, season: selector, allowDuplicates: true }); } });
  command(registry, { name: `${plural}.list`, category: plural, description: `Lista ${plural}.`, usage: `careerEditor.${plural}.list()`, execute: ({ stateManager }) => stateManager.get().seasons.flatMap(s => s[plural] ?? []) });
  command(registry, { name: `${plural}.count`, category: plural, description: `Cuenta ${plural}.`, usage: `careerEditor.${plural}.count()`, execute: (ctx) => ctx.registry.get(`${plural}.list`).execute(ctx).reduce((m, id) => ({ ...m, [id]: (m[id] ?? 0) + 1 }), {}) });
  command(registry, { name: `${plural}.clear`, category: plural, description: `Borra ${plural}.`, usage: `careerEditor.${plural}.clear()`, dangerous: true, execute: ({ stateManager }) => stateManager.mutate(`${plural} eliminados`, d => { for (const s of d.seasons) s[plural] = []; d.totals = recalculateTotals(d); }) });
}
export function registerTrophies(registry) {
  registerCollection(registry, 'trophies', 'trofeo', TROPHIES, 'addTrophy', 'removeTrophy'); registerCollection(registry, 'awards', 'premio', AWARDS, 'addAward', 'removeAward');
  command(registry, { name: 'addAllSeason', category: 'trophies', description: 'Completa los logros que faltan de la última temporada.', usage: 'careerEditor.addAllSeason()', aliases: ['aas'], execute: ({ stateManager, logger }) => {
    let addedTrophies = 0, addedAwards = 0;
    const state = stateManager.mutate('Logros faltantes añadidos a la última temporada', draft => {
    const [index] = resolveSeasonIndexes(draft, 'last'); const season = draft.seasons[index];
    season.trophies ??= []; season.awards ??= [];
    const missingTrophies = TROPHIES.filter(id => !season.trophies.includes(id));
    const missingAwards = AWARDS.filter(id => !season.awards.includes(id));
    season.trophies.push(...missingTrophies); season.awards.push(...missingAwards);
    addedTrophies = missingTrophies.length; addedAwards = missingAwards.length;
    draft.totals = recalculateTotals(draft);
    });
    logger.success(`Temporada completada: +${addedTrophies} trofeos y +${addedAwards} premios.`);
    return state;
  } });
}
